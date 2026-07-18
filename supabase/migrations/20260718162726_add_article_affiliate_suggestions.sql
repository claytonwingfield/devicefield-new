ALTER TABLE public.article_products
  ALTER COLUMN affiliate_link_id DROP NOT NULL;

CREATE TABLE public.article_affiliate_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL
    REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(program_name)) BETWEEN 1 AND 300),
  network TEXT NOT NULL CHECK (
    network IN ('impact', 'shareasale', 'awin', 'rakuten', 'amazon', 'direct', 'other')
  ),
  program_url TEXT NOT NULL CHECK (program_url ~ '^https?://'),
  product_name TEXT CHECK (
    product_name IS NULL OR CHAR_LENGTH(TRIM(product_name)) BETWEEN 1 AND 500
  ),
  evidence_url TEXT NOT NULL CHECK (evidence_url ~ '^https?://'),
  evidence_checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  rationale TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(rationale)) BETWEEN 1 AND 4000),
  target_heading TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(target_heading)) BETWEEN 1 AND 500
  ),
  suggested_placement TEXT NOT NULL CHECK (
    suggested_placement IN (
      'before_section',
      'after_section',
      'within_section',
      'comparison_table',
      'alternatives'
    )
  ),
  insertion_note TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(insertion_note)) BETWEEN 1 AND 4000
  ),
  suggested_cta TEXT CHECK (
    suggested_cta IS NULL OR CHAR_LENGTH(TRIM(suggested_cta)) BETWEEN 1 AND 160
  ),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'shortlisted', 'dismissed')
  ),
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (
    display_order BETWEEN 0 AND 10000
  ),
  created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE UNIQUE INDEX article_affiliate_suggestions_program_heading_idx
  ON public.article_affiliate_suggestions (
    article_id,
    LOWER(program_name),
    LOWER(target_heading)
  );
CREATE INDEX article_affiliate_suggestions_article_order_idx
  ON public.article_affiliate_suggestions (
    article_id,
    review_status,
    display_order
  );

CREATE TRIGGER set_article_affiliate_suggestions_updated_at
  BEFORE UPDATE ON public.article_affiliate_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.article_affiliate_suggestions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_affiliate_suggestions
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.article_affiliate_suggestions
  TO authenticated;

CREATE POLICY "Admins can read affiliate suggestions"
  ON public.article_affiliate_suggestions
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

CREATE POLICY "Admins can review affiliate suggestions"
  ON public.article_affiliate_suggestions
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

CREATE POLICY "Admins can delete affiliate suggestions"
  ON public.article_affiliate_suggestions
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

COMMENT ON TABLE public.article_affiliate_suggestions IS
  'Private, unapproved affiliate-program research tied to an article. Rows are never public affiliate links.';

ALTER FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) RENAME TO create_codex_review_draft_core;

REVOKE ALL ON FUNCTION public.create_codex_review_draft_core(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.create_codex_review_draft(
  p_run_id TEXT,
  p_payload_hash TEXT,
  p_request_fingerprint TEXT,
  p_article JSONB,
  p_products JSONB,
  p_suggestions JSONB
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  workflow_status TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result RECORD;
  v_suggestion JSONB;
  v_unlinked_product JSONB;
  v_target_heading TEXT;
  v_content TEXT;
  v_display_order INTEGER;
  v_product_placement TEXT;
  v_linked_products JSONB;
BEGIN
  IF jsonb_typeof(COALESCE(p_suggestions, '[]'::jsonb)) <> 'array'
    OR jsonb_array_length(COALESCE(p_suggestions, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Affiliate suggestions must be an array with at most 10 items';
  END IF;

  v_content := COALESCE(p_article->>'content', '');

  FOR v_suggestion IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_suggestions, '[]'::jsonb))
  LOOP
    IF jsonb_typeof(v_suggestion) <> 'object'
      OR NULLIF(TRIM(v_suggestion->>'program_name'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'network'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'program_url'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'evidence_url'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'evidence_checked_at'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'rationale'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'target_heading'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'suggested_placement'), '') IS NULL
      OR NULLIF(TRIM(v_suggestion->>'insertion_note'), '') IS NULL THEN
      RAISE EXCEPTION 'Affiliate suggestion is invalid';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_object_keys(v_suggestion) AS fields(field_name)
      WHERE field_name NOT IN (
        'program_name',
        'network',
        'program_url',
        'product_name',
        'evidence_url',
        'evidence_checked_at',
        'rationale',
        'target_heading',
        'suggested_placement',
        'insertion_note',
        'suggested_cta',
        'display_order'
      )
    ) THEN
      RAISE EXCEPTION 'Affiliate suggestion contains unsupported fields';
    END IF;

    IF TRIM(v_suggestion->>'network') NOT IN (
      'impact', 'shareasale', 'awin', 'rakuten', 'amazon', 'direct', 'other'
    ) OR TRIM(v_suggestion->>'suggested_placement') NOT IN (
      'before_section',
      'after_section',
      'within_section',
      'comparison_table',
      'alternatives'
    ) THEN
      RAISE EXCEPTION 'Affiliate suggestion classification is invalid';
    END IF;

    IF TRIM(v_suggestion->>'program_url') !~ '^https?://'
      OR TRIM(v_suggestion->>'evidence_url') !~ '^https?://' THEN
      RAISE EXCEPTION 'Affiliate suggestion URLs are invalid';
    END IF;

    v_target_heading := TRIM(v_suggestion->>'target_heading');
    IF POSITION(E'\n## ' || v_target_heading || E'\n' IN E'\n' || v_content || E'\n') = 0
      AND POSITION(E'\n### ' || v_target_heading || E'\n' IN E'\n' || v_content || E'\n') = 0 THEN
      RAISE EXCEPTION 'Affiliate suggestion target heading is not in the article';
    END IF;

    v_display_order := COALESCE((v_suggestion->>'display_order')::INTEGER, 0);
    IF v_display_order < 0 OR v_display_order > 10000 THEN
      RAISE EXCEPTION 'Affiliate suggestion display order is invalid';
    END IF;

    PERFORM (v_suggestion->>'evidence_checked_at')::TIMESTAMP WITH TIME ZONE;
  END LOOP;

  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
  INTO v_linked_products
  FROM jsonb_array_elements(COALESCE(p_products, '[]'::jsonb))
  WHERE NULLIF(TRIM(value->>'affiliate_link_slug'), '') IS NOT NULL;

  SELECT *
  INTO v_result
  FROM public.create_codex_review_draft_core(
    p_run_id,
    p_payload_hash,
    p_request_fingerprint,
    p_article,
    v_linked_products
  );

  FOR v_unlinked_product IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_products, '[]'::jsonb))
    WHERE NULLIF(TRIM(value->>'affiliate_link_slug'), '') IS NULL
  LOOP
    IF jsonb_typeof(v_unlinked_product) <> 'object'
      OR NULLIF(TRIM(v_unlinked_product->>'product_name'), '') IS NULL
      OR jsonb_typeof(
        COALESCE(v_unlinked_product->'pros', '[]'::jsonb)
      ) <> 'array'
      OR jsonb_typeof(
        COALESCE(v_unlinked_product->'cons', '[]'::jsonb)
      ) <> 'array' THEN
      RAISE EXCEPTION 'Unlinked article product is invalid';
    END IF;

    v_product_placement := COALESCE(
      NULLIF(TRIM(v_unlinked_product->>'placement'), ''),
      'recommendation'
    );
    v_display_order := COALESCE(
      (v_unlinked_product->>'display_order')::INTEGER,
      0
    );
    IF v_product_placement NOT IN (
      'recommendation', 'comparison', 'alternative'
    ) OR v_display_order < 0 OR v_display_order > 10000 THEN
      RAISE EXCEPTION 'Unlinked article product placement is invalid';
    END IF;

    INSERT INTO public.article_products (
      article_id,
      affiliate_link_id,
      product_name,
      award,
      best_for,
      avoid_if,
      verdict,
      pros,
      cons,
      placement,
      display_order
    )
    VALUES (
      v_result.id,
      NULL,
      TRIM(v_unlinked_product->>'product_name'),
      NULLIF(TRIM(v_unlinked_product->>'award'), ''),
      NULLIF(TRIM(v_unlinked_product->>'best_for'), ''),
      NULLIF(TRIM(v_unlinked_product->>'avoid_if'), ''),
      NULLIF(TRIM(v_unlinked_product->>'verdict'), ''),
      ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(v_unlinked_product->'pros', '[]'::jsonb)
        )
      ),
      ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(v_unlinked_product->'cons', '[]'::jsonb)
        )
      ),
      v_product_placement,
      v_display_order
    );
  END LOOP;

  FOR v_suggestion IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_suggestions, '[]'::jsonb))
  LOOP
    INSERT INTO public.article_affiliate_suggestions (
      article_id,
      program_name,
      network,
      program_url,
      product_name,
      evidence_url,
      evidence_checked_at,
      rationale,
      target_heading,
      suggested_placement,
      insertion_note,
      suggested_cta,
      review_status,
      display_order
    )
    VALUES (
      v_result.id,
      TRIM(v_suggestion->>'program_name'),
      TRIM(v_suggestion->>'network'),
      TRIM(v_suggestion->>'program_url'),
      NULLIF(TRIM(v_suggestion->>'product_name'), ''),
      TRIM(v_suggestion->>'evidence_url'),
      (v_suggestion->>'evidence_checked_at')::TIMESTAMP WITH TIME ZONE,
      TRIM(v_suggestion->>'rationale'),
      TRIM(v_suggestion->>'target_heading'),
      TRIM(v_suggestion->>'suggested_placement'),
      TRIM(v_suggestion->>'insertion_note'),
      NULLIF(TRIM(v_suggestion->>'suggested_cta'), ''),
      'pending',
      COALESCE((v_suggestion->>'display_order')::INTEGER, 0)
    );
  END LOOP;

  RETURN QUERY
  SELECT
    v_result.id,
    v_result.slug,
    v_result.workflow_status,
    v_result.cover_image_url,
    v_result.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  JSONB
) TO service_role;

COMMENT ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  JSONB
) IS
  'Atomically creates a review-gated Codex article and private affiliate research suggestions.';

-- Backfill the first Codex validation article from its existing editorial
-- verdict and saved program research. These rows remain private and unlinked.
INSERT INTO public.article_products (
  article_id,
  affiliate_link_id,
  product_name,
  award,
  best_for,
  avoid_if,
  verdict,
  pros,
  cons,
  placement,
  display_order
)
SELECT
  blog_post.id,
  NULL,
  'Zebra DS2208',
  NULL,
  NULLIF(blog_post.quick_verdict->>'best_for', ''),
  NULLIF(blog_post.quick_verdict->>'avoid_if', ''),
  NULLIF(blog_post.quick_verdict->>'verdict', ''),
  ARRAY[
    'Official Shopify compatibility paths are documented',
    'Supports 1D and 2D barcode scanning',
    'Supports POS Hub and direct HID deployment paths'
  ],
  ARRAY[
    'Corded rather than wireless',
    'Direct HID depends on the tablet port and connection hardware',
    'Not hands-on tested by Devicefield'
  ],
  'recommendation',
  0
FROM public.blog_posts AS blog_post
WHERE blog_post.slug = 'zebra-ds2208-shopify-pos'
  AND NOT EXISTS (
    SELECT 1
    FROM public.article_products AS product
    WHERE product.article_id = blog_post.id
      AND LOWER(product.product_name) = 'zebra ds2208'
  );

INSERT INTO public.article_affiliate_suggestions (
  article_id,
  program_name,
  network,
  program_url,
  product_name,
  evidence_url,
  evidence_checked_at,
  rationale,
  target_heading,
  suggested_placement,
  insertion_note,
  suggested_cta,
  review_status,
  display_order
)
SELECT
  blog_post.id,
  suggestion.program_name,
  suggestion.network,
  suggestion.program_url,
  suggestion.product_name,
  suggestion.evidence_url,
  suggestion.evidence_checked_at,
  suggestion.rationale,
  suggestion.target_heading,
  suggestion.suggested_placement,
  suggestion.insertion_note,
  suggestion.suggested_cta,
  'pending',
  suggestion.display_order
FROM public.blog_posts AS blog_post
CROSS JOIN (
  VALUES
    (
      'Amazon Associates'::TEXT,
      'amazon'::TEXT,
      'https://affiliate-program.amazon.com/'::TEXT,
      'Zebra DS2208'::TEXT,
      'https://affiliate-program.amazon.com/'::TEXT,
      '2026-07-18T12:00:00Z'::TIMESTAMP WITH TIME ZONE,
      'Potential retailer coverage for the scanner, compatible cables, and documented alternatives.'::TEXT,
      'Best fit and alternatives'::TEXT,
      'within_section'::TEXT,
      'After the fit criteria, add the Zebra DS2208 recommendation card only after Devicefield is approved and an active link has been created.'::TEXT,
      'Check current pricing'::TEXT,
      0::INTEGER
    ),
    (
      'B&H Affiliate Program'::TEXT,
      'direct'::TEXT,
      'https://www.bhphotovideo.com/c/find/shared/affiliates.jsp'::TEXT,
      'Zebra DS2208'::TEXT,
      'https://www.bhphotovideo.com/c/find/shared/affiliates.jsp'::TEXT,
      '2026-07-18T12:00:00Z'::TIMESTAMP WITH TIME ZONE,
      'Potential specialist-retailer coverage for business barcode hardware discussed in the guide.'::TEXT,
      'Best fit and alternatives'::TEXT,
      'within_section'::TEXT,
      'Place a specialist-retailer CTA beside the researched recommendation only after program approval, product availability review, and link creation.'::TEXT,
      'Check current pricing'::TEXT,
      1::INTEGER
    )
) AS suggestion (
  program_name,
  network,
  program_url,
  product_name,
  evidence_url,
  evidence_checked_at,
  rationale,
  target_heading,
  suggested_placement,
  insertion_note,
  suggested_cta,
  display_order
)
WHERE blog_post.slug = 'zebra-ds2208-shopify-pos'
ON CONFLICT DO NOTHING;
