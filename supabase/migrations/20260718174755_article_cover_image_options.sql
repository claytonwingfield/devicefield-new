CREATE TABLE public.article_cover_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL
    REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL CHECK (image_url ~ '^https?://'),
  image_alt TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(image_alt)) BETWEEN 8 AND 500
  ),
  label TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(label)) BETWEEN 1 AND 120
  ),
  display_order SMALLINT NOT NULL CHECK (display_order BETWEEN 0 AND 2),
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (article_id, image_url),
  UNIQUE (article_id, display_order)
);

CREATE UNIQUE INDEX article_cover_images_selected_idx
  ON public.article_cover_images (article_id)
  WHERE selected;

CREATE INDEX article_cover_images_article_order_idx
  ON public.article_cover_images (article_id, display_order);

CREATE TRIGGER set_article_cover_images_updated_at
  BEFORE UPDATE ON public.article_cover_images
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.article_cover_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_cover_images FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.article_cover_images TO authenticated;

CREATE POLICY "Admins can read article cover options"
  ON public.article_cover_images
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

CREATE POLICY "Admins can update article cover options"
  ON public.article_cover_images
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

COMMENT ON TABLE public.article_cover_images IS
  'Private cover-image choices created for editorial review. Only the selected URL is stored on the public article.';

CREATE FUNCTION public.select_article_cover_image(
  p_article_id UUID,
  p_cover_image_id UUID
)
RETURNS TABLE (
  image_url TEXT,
  image_alt TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_cover public.article_cover_images;
  v_workflow_status TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT blog_posts.workflow_status
  INTO v_workflow_status
  FROM public.blog_posts
  WHERE blog_posts.id = p_article_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article was not found';
  END IF;
  IF v_workflow_status = 'published' THEN
    RAISE EXCEPTION 'Published articles must be unpublished before changing the cover image';
  END IF;

  SELECT cover.*
  INTO v_cover
  FROM public.article_cover_images AS cover
  WHERE cover.id = p_cover_image_id
    AND cover.article_id = p_article_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cover image option was not found';
  END IF;

  UPDATE public.article_cover_images
  SET selected = FALSE
  WHERE article_id = p_article_id
    AND selected;

  UPDATE public.article_cover_images
  SET selected = TRUE
  WHERE id = p_cover_image_id;

  UPDATE public.blog_posts
  SET
    cover_image_url = v_cover.image_url,
    cover_image_alt = v_cover.image_alt
  WHERE id = p_article_id;

  RETURN QUERY SELECT v_cover.image_url, v_cover.image_alt;
END;
$$;

REVOKE ALL ON FUNCTION public.select_article_cover_image(UUID, UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.select_article_cover_image(UUID, UUID)
  TO authenticated;

COMMENT ON FUNCTION public.select_article_cover_image(UUID, UUID) IS
  'Atomically selects a private cover option and updates the article cover. Published articles remain locked.';

CREATE FUNCTION public.create_codex_review_draft(
  p_run_id TEXT,
  p_payload_hash TEXT,
  p_request_fingerprint TEXT,
  p_article JSONB,
  p_products JSONB,
  p_suggestions JSONB,
  p_cover_images JSONB
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
  v_cover JSONB;
  v_selected JSONB;
BEGIN
  IF jsonb_typeof(COALESCE(p_cover_images, '[]'::jsonb)) <> 'array'
    OR jsonb_array_length(COALESCE(p_cover_images, '[]'::jsonb)) <> 3 THEN
    RAISE EXCEPTION 'Exactly three cover image options are required';
  END IF;

  FOR v_cover IN
    SELECT value
    FROM jsonb_array_elements(p_cover_images)
  LOOP
    IF jsonb_typeof(v_cover) <> 'object'
      OR NULLIF(TRIM(v_cover->>'image_url'), '') IS NULL
      OR NULLIF(TRIM(v_cover->>'image_alt'), '') IS NULL
      OR NULLIF(TRIM(v_cover->>'label'), '') IS NULL
      OR NOT (v_cover ? 'display_order')
      OR NOT (v_cover ? 'selected') THEN
      RAISE EXCEPTION 'Cover image option is invalid';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_object_keys(v_cover) AS fields(field_name)
      WHERE field_name NOT IN (
        'image_url', 'image_alt', 'label', 'display_order', 'selected'
      )
    ) THEN
      RAISE EXCEPTION 'Cover image option contains unsupported fields';
    END IF;

    IF TRIM(v_cover->>'image_url') !~ '^https?://'
      OR CHAR_LENGTH(TRIM(v_cover->>'image_alt')) NOT BETWEEN 8 AND 500
      OR CHAR_LENGTH(TRIM(v_cover->>'label')) NOT BETWEEN 1 AND 120
      OR (v_cover->>'display_order')::INTEGER NOT BETWEEN 0 AND 2
      OR jsonb_typeof(v_cover->'selected') <> 'boolean' THEN
      RAISE EXCEPTION 'Cover image option is invalid';
    END IF;
  END LOOP;

  IF (
    SELECT COUNT(DISTINCT (value->>'display_order')::INTEGER)
    FROM jsonb_array_elements(p_cover_images)
  ) <> 3 OR (
    SELECT COUNT(*)
    FROM jsonb_array_elements(p_cover_images)
    WHERE (value->>'selected')::BOOLEAN
  ) <> 1 THEN
    RAISE EXCEPTION 'Cover image options require unique positions and one selection';
  END IF;

  SELECT value
  INTO v_selected
  FROM jsonb_array_elements(p_cover_images)
  WHERE (value->>'selected')::BOOLEAN;

  IF TRIM(v_selected->>'image_url') <> TRIM(COALESCE(p_article->>'cover_image_url', ''))
    OR TRIM(v_selected->>'image_alt') <> TRIM(COALESCE(p_article->>'cover_image_alt', '')) THEN
    RAISE EXCEPTION 'Selected cover image must match the article cover';
  END IF;

  SELECT *
  INTO v_result
  FROM public.create_codex_review_draft(
    p_run_id,
    p_payload_hash,
    p_request_fingerprint,
    p_article,
    p_products,
    p_suggestions
  );

  INSERT INTO public.article_cover_images (
    article_id,
    image_url,
    image_alt,
    label,
    display_order,
    selected
  )
  SELECT
    v_result.id,
    TRIM(value->>'image_url'),
    TRIM(value->>'image_alt'),
    TRIM(value->>'label'),
    (value->>'display_order')::SMALLINT,
    (value->>'selected')::BOOLEAN
  FROM jsonb_array_elements(p_cover_images);

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
  JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_codex_review_draft(
  TEXT,
  TEXT,
  TEXT,
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
  JSONB
) IS
  'Atomically creates a review-gated Codex article with three private cover-image options.';

INSERT INTO public.article_cover_images (
  article_id,
  image_url,
  image_alt,
  label,
  display_order,
  selected
)
SELECT
  post.id,
  post.cover_image_url,
  CASE
    WHEN CHAR_LENGTH(TRIM(COALESCE(post.cover_image_alt, ''))) >= 8
      THEN TRIM(post.cover_image_alt)
    ELSE LEFT('Cover image for ' || post.title, 500)
  END,
  'Current cover',
  0,
  TRUE
FROM public.blog_posts AS post
WHERE NULLIF(TRIM(post.cover_image_url), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.article_cover_images AS cover
    WHERE cover.article_id = post.id
  );
