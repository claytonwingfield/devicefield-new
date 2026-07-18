CREATE TABLE public.article_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL
    REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'facebook', 'instagram')),
  content TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(content)) BETWEEN 1 AND
      CASE platform
        WHEN 'x' THEN 280
        WHEN 'instagram' THEN 2200
        ELSE 5000
      END
  ),
  created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (article_id, platform)
);

CREATE INDEX article_social_posts_article_idx
  ON public.article_social_posts (article_id, platform);

CREATE TRIGGER set_article_social_posts_updated_at
  BEFORE UPDATE ON public.article_social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.article_social_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_social_posts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.article_social_posts TO authenticated;

CREATE POLICY "Admins can read article social drafts"
  ON public.article_social_posts
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

CREATE POLICY "Admins can insert article social drafts"
  ON public.article_social_posts
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

CREATE POLICY "Admins can update article social drafts"
  ON public.article_social_posts
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

COMMENT ON TABLE public.article_social_posts IS
  'Private, unpublished social copy for an article. Drafts are created by Codex and reviewed by an admin.';

CREATE FUNCTION public.create_codex_review_draft(
  p_run_id TEXT,
  p_payload_hash TEXT,
  p_request_fingerprint TEXT,
  p_article JSONB,
  p_products JSONB,
  p_suggestions JSONB,
  p_cover_images JSONB,
  p_social_posts JSONB
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
  v_social_post JSONB;
  v_platform TEXT;
  v_content TEXT;
  v_canonical_url TEXT;
BEGIN
  IF jsonb_typeof(COALESCE(p_social_posts, '[]'::jsonb)) <> 'array'
    OR jsonb_array_length(COALESCE(p_social_posts, '[]'::jsonb)) <> 3 THEN
    RAISE EXCEPTION 'Exactly three social drafts are required';
  END IF;

  v_canonical_url := NULLIF(TRIM(p_article->>'canonical_url'), '');
  IF v_canonical_url IS NULL THEN
    RAISE EXCEPTION 'A canonical URL is required for social drafts';
  END IF;

  FOR v_social_post IN
    SELECT value
    FROM jsonb_array_elements(p_social_posts)
  LOOP
    IF jsonb_typeof(v_social_post) <> 'object'
      OR NULLIF(TRIM(v_social_post->>'platform'), '') IS NULL
      OR NULLIF(TRIM(v_social_post->>'content'), '') IS NULL THEN
      RAISE EXCEPTION 'Social draft is invalid';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_object_keys(v_social_post) AS fields(field_name)
      WHERE field_name NOT IN ('platform', 'content')
    ) THEN
      RAISE EXCEPTION 'Social draft contains unsupported fields';
    END IF;

    v_platform := TRIM(v_social_post->>'platform');
    v_content := TRIM(v_social_post->>'content');

    IF v_platform NOT IN ('x', 'facebook', 'instagram') THEN
      RAISE EXCEPTION 'Social draft platform is invalid';
    END IF;

    IF (v_platform = 'x' AND CHAR_LENGTH(v_content) > 280)
      OR (v_platform = 'instagram' AND CHAR_LENGTH(v_content) > 2200)
      OR (v_platform = 'facebook' AND CHAR_LENGTH(v_content) > 5000) THEN
      RAISE EXCEPTION 'Social draft is too long';
    END IF;

    IF POSITION(v_canonical_url IN v_content) = 0 THEN
      RAISE EXCEPTION 'Social draft must include the canonical article URL';
    END IF;
  END LOOP;

  IF (
    SELECT COUNT(DISTINCT TRIM(value->>'platform'))
    FROM jsonb_array_elements(p_social_posts)
  ) <> 3 THEN
    RAISE EXCEPTION 'Social drafts must include X, Facebook, and Instagram';
  END IF;

  SELECT *
  INTO v_result
  FROM public.create_codex_review_draft(
    p_run_id,
    p_payload_hash,
    p_request_fingerprint,
    p_article,
    p_products,
    p_suggestions,
    p_cover_images
  );

  INSERT INTO public.article_social_posts (
    article_id,
    platform,
    content
  )
  SELECT
    v_result.id,
    TRIM(value->>'platform'),
    TRIM(value->>'content')
  FROM jsonb_array_elements(p_social_posts);

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
  JSONB,
  JSONB,
  JSONB
) IS
  'Atomically creates a review-gated Codex article with cover options and three private social drafts.';
