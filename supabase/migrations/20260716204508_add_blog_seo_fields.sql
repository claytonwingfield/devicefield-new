ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS faq_items JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_faq_items_is_array;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_faq_items_is_array
  CHECK (jsonb_typeof(faq_items) = 'array');

UPDATE public.blog_posts
SET
  seo_title = COALESCE(seo_title, title),
  meta_description = COALESCE(meta_description, excerpt),
  cover_image_alt = COALESCE(cover_image_alt, title)
WHERE seo_title IS NULL
  OR meta_description IS NULL
  OR cover_image_alt IS NULL;
