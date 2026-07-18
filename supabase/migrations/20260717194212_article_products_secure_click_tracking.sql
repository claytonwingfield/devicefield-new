CREATE TABLE IF NOT EXISTS public.article_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(product_name)) > 0),
  award TEXT,
  best_for TEXT,
  avoid_if TEXT,
  verdict TEXT,
  pros TEXT[] NOT NULL DEFAULT '{}',
  cons TEXT[] NOT NULL DEFAULT '{}',
  placement TEXT NOT NULL DEFAULT 'recommendation' CHECK (
    placement IN ('recommendation', 'comparison', 'alternative')
  ),
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (article_id, affiliate_link_id, placement)
);

CREATE INDEX IF NOT EXISTS idx_article_products_article_order
  ON public.article_products(article_id, display_order);
CREATE INDEX IF NOT EXISTS idx_article_products_affiliate_link
  ON public.article_products(affiliate_link_id);

DROP TRIGGER IF EXISTS set_article_products_updated_at ON public.article_products;
CREATE TRIGGER set_article_products_updated_at
  BEFORE UPDATE ON public.article_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.article_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published article products are public" ON public.article_products;
CREATE POLICY "Published article products are public"
  ON public.article_products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.blog_posts
      WHERE blog_posts.id = article_products.article_id
        AND blog_posts.status = 'published'
        AND blog_posts.published_at IS NOT NULL
        AND blog_posts.published_at <= NOW()
    )
    AND EXISTS (
      SELECT 1
      FROM public.affiliate_links
      WHERE affiliate_links.id = article_products.affiliate_link_id
        AND affiliate_links.active = true
    )
  );

DROP POLICY IF EXISTS "Admins can read article products" ON public.article_products;
CREATE POLICY "Admins can read article products"
  ON public.article_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert article products" ON public.article_products;
CREATE POLICY "Admins can insert article products"
  ON public.article_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update article products" ON public.article_products;
CREATE POLICY "Admins can update article products"
  ON public.article_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete article products" ON public.article_products;
CREATE POLICY "Admins can delete article products"
  ON public.article_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON public.article_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_products TO authenticated;

COMMENT ON COLUMN public.blog_posts.affiliate_programs IS
  'Deprecated. Article affiliate relationships are stored in public.article_products.';

DROP POLICY IF EXISTS "Anyone can log affiliate clicks" ON public.affiliate_click_events;
REVOKE INSERT ON public.affiliate_click_events FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_visitor_rate_limit
  ON public.affiliate_click_events(affiliate_link_id, user_agent_hash, created_at DESC)
  WHERE user_agent_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_affiliate_click(
  p_affiliate_link_id UUID,
  p_article_id UUID DEFAULT NULL,
  p_cta_placement TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_visitor_hash TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_article_id UUID := NULL;
BEGIN
  IF p_visitor_hash IS NULL OR CHAR_LENGTH(p_visitor_hash) < 32 THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.affiliate_links
    WHERE id = p_affiliate_link_id
      AND active = true
      AND use_redirect = true
  ) THEN
    RETURN false;
  END IF;

  IF p_article_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.blog_posts
    WHERE id = p_article_id
      AND status = 'published'
      AND published_at IS NOT NULL
      AND published_at <= NOW()
  ) THEN
    v_article_id := p_article_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_affiliate_link_id::TEXT || ':' || p_visitor_hash, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.affiliate_click_events
    WHERE affiliate_link_id = p_affiliate_link_id
      AND user_agent_hash = LEFT(p_visitor_hash, 64)
      AND created_at >= NOW() - INTERVAL '60 seconds'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.affiliate_click_events (
    affiliate_link_id,
    article_id,
    cta_placement,
    referrer,
    user_agent_hash,
    country
  )
  VALUES (
    p_affiliate_link_id,
    v_article_id,
    NULLIF(LEFT(TRIM(p_cta_placement), 80), ''),
    NULLIF(LEFT(TRIM(p_referrer), 500), ''),
    LEFT(p_visitor_hash, 64),
    NULLIF(LEFT(UPPER(TRIM(p_country)), 2), '')
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_affiliate_click(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.affiliate_links, public.blog_posts TO service_role;
GRANT SELECT, INSERT ON public.affiliate_click_events TO service_role;
GRANT EXECUTE ON FUNCTION public.record_affiliate_click(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
