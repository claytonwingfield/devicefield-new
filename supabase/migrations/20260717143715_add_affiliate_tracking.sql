CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'other' CHECK (
    network IN ('impact', 'shareasale', 'awin', 'rakuten', 'amazon', 'direct', 'other')
  ),
  status TEXT NOT NULL DEFAULT 'not_applied' CHECK (
    status IN ('not_applied', 'pending', 'approved', 'rejected', 'paused')
  ),
  commission_summary TEXT,
  cookie_duration TEXT,
  payout_notes TEXT,
  terms_url TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_programs_status
  ON public.affiliate_programs(status);

DROP TRIGGER IF EXISTS set_affiliate_programs_updated_at ON public.affiliate_programs;
CREATE TRIGGER set_affiliate_programs_updated_at
  BEFORE UPDATE ON public.affiliate_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved affiliate programs are public" ON public.affiliate_programs;
CREATE POLICY "Approved affiliate programs are public"
  ON public.affiliate_programs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can read affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Admins can read affiliate programs"
  ON public.affiliate_programs
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

DROP POLICY IF EXISTS "Admins can insert affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Admins can insert affiliate programs"
  ON public.affiliate_programs
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

DROP POLICY IF EXISTS "Admins can update affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Admins can update affiliate programs"
  ON public.affiliate_programs
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

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  destination_url TEXT NOT NULL,
  use_redirect BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  disclosure_required BOOLEAN NOT NULL DEFAULT true,
  rel TEXT NOT NULL DEFAULT 'sponsored nofollow' CHECK (rel = 'sponsored nofollow'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_program_id
  ON public.affiliate_links(program_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active
  ON public.affiliate_links(active);

DROP TRIGGER IF EXISTS set_affiliate_links_updated_at ON public.affiliate_links;
CREATE TRIGGER set_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active affiliate links are public" ON public.affiliate_links;
CREATE POLICY "Active affiliate links are public"
  ON public.affiliate_links
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Admins can read affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can read affiliate links"
  ON public.affiliate_links
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

DROP POLICY IF EXISTS "Admins can insert affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can insert affiliate links"
  ON public.affiliate_links
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

DROP POLICY IF EXISTS "Admins can update affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can update affiliate links"
  ON public.affiliate_links
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

CREATE TABLE IF NOT EXISTS public.affiliate_click_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  cta_placement TEXT,
  referrer TEXT,
  user_agent_hash TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_link_created
  ON public.affiliate_click_events(affiliate_link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_article_created
  ON public.affiliate_click_events(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_created
  ON public.affiliate_click_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_cta_placement
  ON public.affiliate_click_events(cta_placement);

ALTER TABLE public.affiliate_click_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log affiliate clicks" ON public.affiliate_click_events;
CREATE POLICY "Anyone can log affiliate clicks"
  ON public.affiliate_click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read affiliate clicks" ON public.affiliate_click_events;
CREATE POLICY "Admins can read affiliate clicks"
  ON public.affiliate_click_events
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

GRANT SELECT ON public.affiliate_programs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.affiliate_programs TO authenticated;
GRANT SELECT ON public.affiliate_links TO anon;
GRANT SELECT, INSERT, UPDATE ON public.affiliate_links TO authenticated;
GRANT INSERT ON public.affiliate_click_events TO anon;
GRANT SELECT, INSERT ON public.affiliate_click_events TO authenticated;
