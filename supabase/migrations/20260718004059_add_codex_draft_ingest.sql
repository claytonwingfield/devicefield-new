CREATE OR REPLACE FUNCTION public.ingest_codex_draft(p_article JSONB)
RETURNS TABLE (
  article_id UUID,
  article_slug TEXT,
  workflow_status TEXT,
  was_created BOOLEAN,
  article_updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_article public.blog_posts;
  v_existing public.blog_posts;
  v_slug TEXT;
  v_article_type TEXT;
  v_category TEXT;
BEGIN
  IF p_article IS NULL OR jsonb_typeof(p_article) <> 'object' THEN
    RAISE EXCEPTION 'Draft article must be a JSON object';
  END IF;

  IF p_article ?| ARRAY[
    'workflow_status', 'status', 'approved_at', 'scheduled_for',
    'published_at', 'featured', 'author_id', 'reviewer_id', 'reviewed_at'
  ] THEN
    RAISE EXCEPTION 'Draft ingestion cannot set editorial workflow fields';
  END IF;

  IF NULLIF(TRIM(p_article->>'title'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'slug'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'excerpt'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'content'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'category'), '') IS NULL THEN
    RAISE EXCEPTION 'Title, slug, excerpt, content, and category are required';
  END IF;

  v_slug := LOWER(TRIM(p_article->>'slug'));
  v_article_type := COALESCE(
    NULLIF(TRIM(p_article->>'article_type'), ''),
    'buying_guide'
  );
  v_category := TRIM(p_article->>'category');

  IF v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    OR CHAR_LENGTH(v_slug) > 160 THEN
    RAISE EXCEPTION 'Draft slug is invalid';
  END IF;

  IF v_category NOT IN (
    'Barcode & Inventory',
    'Receipt & Label Printing',
    'POS Hardware',
    'Networking & Uptime',
    'Business Software',
    'Troubleshooting'
  ) THEN
    RAISE EXCEPTION 'Draft category is invalid';
  END IF;

  IF v_article_type NOT IN (
    'buying_guide',
    'review',
    'comparison',
    'setup_guide',
    'compatibility_guide',
    'troubleshooting'
  ) THEN
    RAISE EXCEPTION 'Draft article type is invalid';
  END IF;

  IF NULLIF(TRIM(p_article->>'testing_status'), '') IS NOT NULL
    AND TRIM(p_article->>'testing_status') <> 'researched' THEN
    RAISE EXCEPTION 'Codex drafts must use researched testing status';
  END IF;

  IF jsonb_typeof(COALESCE(p_article->'tags', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'faq_items', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'sources', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'claims', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'quick_verdict', '{}'::jsonb)) <> 'object'
    OR jsonb_typeof(COALESCE(p_article->'original_evidence', '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Draft list and object fields are invalid';
  END IF;

  IF jsonb_array_length(COALESCE(p_article->'original_evidence', '[]'::jsonb)) > 0 THEN
    RAISE EXCEPTION 'Codex drafts cannot claim original testing evidence';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('codex-draft:' || v_slug, 0));

  SELECT *
  INTO v_existing
  FROM public.blog_posts
  WHERE slug = v_slug
  FOR UPDATE;

  IF v_existing.id IS NOT NULL AND v_existing.workflow_status <> 'draft' THEN
    RAISE EXCEPTION 'Codex ingestion can update only draft articles';
  END IF;

  IF v_existing.id IS NULL THEN
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
      sources,
      claims,
      quick_verdict,
      compatibility_notes,
      limitations,
      testing_method,
      original_evidence,
      internal_notes,
      featured
    )
    VALUES (
      TRIM(p_article->>'title'),
      v_slug,
      TRIM(p_article->>'excerpt'),
      TRIM(p_article->>'content'),
      v_category,
      ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(p_article->'tags', '[]'::jsonb)
        )
      ),
      NULLIF(TRIM(p_article->>'cover_image_url'), ''),
      NULLIF(TRIM(p_article->>'cover_image_alt'), ''),
      NULLIF(TRIM(p_article->>'focus_keyword'), ''),
      COALESCE(
        NULLIF(TRIM(p_article->>'seo_title'), ''),
        TRIM(p_article->>'title')
      ),
      COALESCE(
        NULLIF(TRIM(p_article->>'meta_description'), ''),
        TRIM(p_article->>'excerpt')
      ),
      NULLIF(TRIM(p_article->>'canonical_url'), ''),
      COALESCE(p_article->'faq_items', '[]'::jsonb),
      v_article_type,
      'researched',
      'draft',
      COALESCE(p_article->'sources', '[]'::jsonb),
      COALESCE(p_article->'claims', '[]'::jsonb),
      COALESCE(p_article->'quick_verdict', '{}'::jsonb),
      NULLIF(TRIM(p_article->>'compatibility_notes'), ''),
      NULLIF(TRIM(p_article->>'limitations'), ''),
      NULLIF(TRIM(p_article->>'testing_method'), ''),
      '[]'::jsonb,
      COALESCE(
        NULLIF(TRIM(p_article->>'internal_notes'), ''),
        'Imported through the Codex draft ingestion endpoint.'
      ),
      false
    )
    RETURNING * INTO v_article;

    RETURN QUERY
    SELECT
      v_article.id,
      v_article.slug,
      v_article.workflow_status,
      true,
      v_article.updated_at;
  ELSE
    UPDATE public.blog_posts
    SET
      title = TRIM(p_article->>'title'),
      excerpt = TRIM(p_article->>'excerpt'),
      content = TRIM(p_article->>'content'),
      category = v_category,
      tags = ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(p_article->'tags', '[]'::jsonb)
        )
      ),
      cover_image_url = NULLIF(TRIM(p_article->>'cover_image_url'), ''),
      cover_image_alt = NULLIF(TRIM(p_article->>'cover_image_alt'), ''),
      focus_keyword = NULLIF(TRIM(p_article->>'focus_keyword'), ''),
      seo_title = COALESCE(
        NULLIF(TRIM(p_article->>'seo_title'), ''),
        TRIM(p_article->>'title')
      ),
      meta_description = COALESCE(
        NULLIF(TRIM(p_article->>'meta_description'), ''),
        TRIM(p_article->>'excerpt')
      ),
      canonical_url = NULLIF(TRIM(p_article->>'canonical_url'), ''),
      faq_items = COALESCE(p_article->'faq_items', '[]'::jsonb),
      article_type = v_article_type,
      testing_status = 'researched',
      workflow_status = 'draft',
      sources = COALESCE(p_article->'sources', '[]'::jsonb),
      claims = COALESCE(p_article->'claims', '[]'::jsonb),
      quick_verdict = COALESCE(p_article->'quick_verdict', '{}'::jsonb),
      compatibility_notes = NULLIF(TRIM(p_article->>'compatibility_notes'), ''),
      limitations = NULLIF(TRIM(p_article->>'limitations'), ''),
      testing_method = NULLIF(TRIM(p_article->>'testing_method'), ''),
      approved_at = NULL,
      scheduled_for = NULL,
      published_at = NULL,
      reviewed_at = NULL,
      last_reviewed_at = NULL,
      last_verified_at = NULL,
      next_review_at = NULL
    WHERE id = v_existing.id
    RETURNING * INTO v_article;

    RETURN QUERY
    SELECT
      v_article.id,
      v_article.slug,
      v_article.workflow_status,
      false,
      v_article.updated_at;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_codex_draft(JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_codex_draft(JSONB)
  TO service_role;

COMMENT ON FUNCTION public.ingest_codex_draft(JSONB) IS
  'Creates or updates researched draft content by slug. Callable only by service_role.';
