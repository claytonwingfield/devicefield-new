CREATE TABLE IF NOT EXISTS public.codex_draft_ingest_runs (
  run_id TEXT PRIMARY KEY CHECK (
    run_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$'
  ),
  article_id UUID NOT NULL UNIQUE
    REFERENCES public.blog_posts(id) ON DELETE RESTRICT,
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  request_fingerprint TEXT NOT NULL CHECK (
    request_fingerprint ~ '^[a-f0-9]{64}$'
  ),
  created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.codex_draft_ingest_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.codex_draft_ingest_runs
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.codex_draft_ingest_runs TO service_role;

DROP FUNCTION IF EXISTS public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
);

CREATE FUNCTION public.create_codex_review_draft(
  p_run_id TEXT,
  p_payload_hash TEXT,
  p_request_fingerprint TEXT,
  p_article JSONB,
  p_products JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  workflow_status TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_article public.blog_posts;
  v_author_id UUID;
  v_reviewer_id UUID;
  v_affiliate_link_id UUID;
  v_product JSONB;
  v_product_placement TEXT;
  v_display_order INTEGER;
  v_testing_status TEXT;
  v_slug TEXT;
BEGIN
  IF p_run_id IS NULL
    OR p_run_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$' THEN
    RAISE EXCEPTION 'Codex run ID is invalid';
  END IF;

  IF p_payload_hash IS NULL OR p_payload_hash !~ '^[a-f0-9]{64}$'
    OR p_request_fingerprint IS NULL
    OR p_request_fingerprint !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Codex request identity is invalid';
  END IF;

  IF p_article IS NULL OR jsonb_typeof(p_article) <> 'object' THEN
    RAISE EXCEPTION 'Draft article must be a JSON object';
  END IF;

  IF p_article ?| ARRAY[
    'workflow_status', 'status', 'approved_at', 'scheduled_for',
    'published_at', 'archived_at', 'created_by', 'author_id', 'reviewer_id',
    'reviewed_at', 'last_reviewed_at'
  ] THEN
    RAISE EXCEPTION 'Codex ingestion cannot set editorial workflow fields';
  END IF;

  IF COALESCE((p_article->>'featured')::BOOLEAN, false) THEN
    RAISE EXCEPTION 'Codex ingestion cannot feature articles';
  END IF;

  IF NULLIF(TRIM(p_article->>'title'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'slug'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'excerpt'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'content'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'category'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'cover_image_url'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'cover_image_alt'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'author_slug'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'reviewer_slug'), '') IS NULL THEN
    RAISE EXCEPTION 'Required Codex article fields are missing';
  END IF;

  v_slug := LOWER(TRIM(p_article->>'slug'));
  v_testing_status := NULLIF(TRIM(p_article->>'testing_status'), '');

  IF v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    OR CHAR_LENGTH(v_slug) > 160 THEN
    RAISE EXCEPTION 'Draft slug is invalid';
  END IF;

  IF TRIM(p_article->>'category') NOT IN (
    'Barcode & Inventory',
    'Receipt & Label Printing',
    'POS Hardware',
    'Networking & Uptime',
    'Business Software',
    'Troubleshooting'
  ) THEN
    RAISE EXCEPTION 'Draft category is invalid';
  END IF;

  IF COALESCE(NULLIF(TRIM(p_article->>'article_type'), ''), 'buying_guide')
    NOT IN (
      'buying_guide',
      'review',
      'comparison',
      'setup_guide',
      'compatibility_guide',
      'troubleshooting'
    ) THEN
    RAISE EXCEPTION 'Draft article type is invalid';
  END IF;

  IF v_testing_status NOT IN ('tested', 'researched', 'mixed') THEN
    RAISE EXCEPTION 'Draft testing status is invalid';
  END IF;

  IF jsonb_typeof(COALESCE(p_article->'tags', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'faq_items', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'sources', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'claims', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'quick_verdict', '{}'::jsonb)) <> 'object'
    OR jsonb_typeof(COALESCE(p_article->'original_evidence', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_products, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Codex article list and object fields are invalid';
  END IF;

  IF v_testing_status IN ('tested', 'mixed')
    AND jsonb_array_length(
      COALESCE(p_article->'original_evidence', '[]'::jsonb)
    ) = 0 THEN
    RAISE EXCEPTION 'Tested or mixed drafts require original evidence';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      COALESCE(p_article->'claims', '[]'::jsonb)
    ) AS claim
    WHERE claim->>'risk' = 'high'
      AND COALESCE((claim->>'resolved')::BOOLEAN, false) = false
  ) THEN
    RAISE EXCEPTION 'Unresolved high-risk claims are not allowed';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('codex-run:' || p_run_id, 0)
  );
  PERFORM pg_advisory_xact_lock(
    hashtextextended('codex-slug:' || v_slug, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.codex_draft_ingest_runs AS ingest_run
    WHERE ingest_run.run_id = p_run_id
  ) THEN
    RAISE EXCEPTION 'Codex run ID has already been submitted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.blog_posts AS blog_post
    WHERE blog_post.slug = v_slug
  ) THEN
    RAISE EXCEPTION 'Article slug already exists';
  END IF;

  SELECT author.id
  INTO v_author_id
  FROM public.authors AS author
  WHERE author.slug = TRIM(p_article->>'author_slug');

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Article author was not found';
  END IF;

  SELECT reviewer.id
  INTO v_reviewer_id
  FROM public.authors AS reviewer
  WHERE reviewer.slug = TRIM(p_article->>'reviewer_slug');

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Article reviewer was not found';
  END IF;

  INSERT INTO public.blog_posts (
    title,
    slug,
    excerpt,
    content,
    category,
    tags,
    cover_image_url,
    cover_image_alt,
    focus_keyword,
    seo_title,
    meta_description,
    canonical_url,
    faq_items,
    article_type,
    testing_status,
    workflow_status,
    author_id,
    reviewer_id,
    reviewed_at,
    last_verified_at,
    next_review_at,
    sources,
    claims,
    quick_verdict,
    compatibility_notes,
    limitations,
    testing_method,
    original_evidence,
    approved_at,
    scheduled_for,
    last_reviewed_at,
    internal_notes,
    status,
    featured,
    published_at
  )
  VALUES (
    TRIM(p_article->>'title'),
    v_slug,
    TRIM(p_article->>'excerpt'),
    TRIM(p_article->>'content'),
    TRIM(p_article->>'category'),
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(p_article->'tags', '[]'::jsonb)
      )
    ),
    TRIM(p_article->>'cover_image_url'),
    TRIM(p_article->>'cover_image_alt'),
    NULLIF(TRIM(p_article->>'focus_keyword'), ''),
    NULLIF(TRIM(p_article->>'seo_title'), ''),
    NULLIF(TRIM(p_article->>'meta_description'), ''),
    NULLIF(TRIM(p_article->>'canonical_url'), ''),
    COALESCE(p_article->'faq_items', '[]'::jsonb),
    COALESCE(
      NULLIF(TRIM(p_article->>'article_type'), ''),
      'buying_guide'
    ),
    v_testing_status,
    'draft',
    v_author_id,
    v_reviewer_id,
    NULL,
    NULLIF(p_article->>'last_verified_at', '')::TIMESTAMP WITH TIME ZONE,
    NULLIF(p_article->>'next_review_at', '')::TIMESTAMP WITH TIME ZONE,
    COALESCE(p_article->'sources', '[]'::jsonb),
    COALESCE(p_article->'claims', '[]'::jsonb),
    COALESCE(p_article->'quick_verdict', '{}'::jsonb),
    NULLIF(TRIM(p_article->>'compatibility_notes'), ''),
    NULLIF(TRIM(p_article->>'limitations'), ''),
    NULLIF(TRIM(p_article->>'testing_method'), ''),
    COALESCE(p_article->'original_evidence', '[]'::jsonb),
    NULL,
    NULL,
    NULL,
    NULLIF(TRIM(p_article->>'internal_notes'), ''),
    'draft',
    false,
    NULL
  )
  RETURNING * INTO v_article;

  FOR v_product IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_products, '[]'::jsonb))
  LOOP
    IF jsonb_typeof(v_product) <> 'object'
      OR NULLIF(TRIM(v_product->>'affiliate_link_slug'), '') IS NULL
      OR NULLIF(TRIM(v_product->>'product_name'), '') IS NULL
      OR jsonb_typeof(COALESCE(v_product->'pros', '[]'::jsonb)) <> 'array'
      OR jsonb_typeof(COALESCE(v_product->'cons', '[]'::jsonb)) <> 'array' THEN
      RAISE EXCEPTION 'Article product is invalid';
    END IF;

    v_product_placement := COALESCE(
      NULLIF(TRIM(v_product->>'placement'), ''),
      'recommendation'
    );
    v_display_order := COALESCE((v_product->>'display_order')::INTEGER, 0);

    IF v_product_placement NOT IN (
      'recommendation',
      'comparison',
      'alternative'
    ) OR v_display_order < 0 THEN
      RAISE EXCEPTION 'Article product placement is invalid';
    END IF;

    SELECT affiliate_link.id
    INTO v_affiliate_link_id
    FROM public.affiliate_links AS affiliate_link
    JOIN public.affiliate_programs AS affiliate_program
      ON affiliate_program.id = affiliate_link.program_id
    WHERE affiliate_link.slug = TRIM(v_product->>'affiliate_link_slug')
      AND affiliate_link.active = true
      AND affiliate_program.status = 'approved';

    IF v_affiliate_link_id IS NULL THEN
      RAISE EXCEPTION 'Article product affiliate link is unavailable';
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
      v_article.id,
      v_affiliate_link_id,
      TRIM(v_product->>'product_name'),
      NULLIF(TRIM(v_product->>'award'), ''),
      NULLIF(TRIM(v_product->>'best_for'), ''),
      NULLIF(TRIM(v_product->>'avoid_if'), ''),
      NULLIF(TRIM(v_product->>'verdict'), ''),
      ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(v_product->'pros', '[]'::jsonb)
        )
      ),
      ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(v_product->'cons', '[]'::jsonb)
        )
      ),
      v_product_placement,
      v_display_order
    );
  END LOOP;

  UPDATE public.blog_posts
  SET
    workflow_status = 'ready_for_review',
    status = 'draft',
    approved_at = NULL,
    published_at = NULL,
    scheduled_for = NULL
  WHERE blog_posts.id = v_article.id
  RETURNING * INTO v_article;

  INSERT INTO public.codex_draft_ingest_runs (
    run_id,
    article_id,
    payload_hash,
    request_fingerprint
  )
  VALUES (
    p_run_id,
    v_article.id,
    p_payload_hash,
    p_request_fingerprint
  );

  RETURN QUERY
  SELECT
    v_article.id,
    v_article.slug,
    v_article.workflow_status,
    v_article.cover_image_url,
    v_article.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) TO service_role;

COMMENT ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) IS
  'Creates one idempotency-guarded article ready for human editorial review.';

REVOKE ALL ON FUNCTION public.ingest_codex_draft(JSONB)
  FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.ingest_codex_draft(JSONB);
