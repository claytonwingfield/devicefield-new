UPDATE public.site_pages
SET
  meta_description = 'Independent buying guides, product reviews, comparisons, setup guides, and troubleshooting articles for business devices and systems.',
  content = jsonb_set(
    jsonb_set(
      content,
      '{intro}',
      to_jsonb('Independent buying guides, compatibility notes, reviews, setup guides, and troubleshooting articles for business devices and systems.'::text),
      true
    ),
    '{primaryCta}',
    to_jsonb('Browse Buying Guides'::text),
    true
  )
WHERE slug = 'home';
