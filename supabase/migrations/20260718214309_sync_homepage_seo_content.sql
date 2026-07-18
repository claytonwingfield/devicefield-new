UPDATE public.site_pages
SET
  title = 'Devicefield | Business Technology Reviews & Buying Guides',
  meta_description = 'Independent reviews, buying guides, comparisons, setup help, and troubleshooting for POS, barcode, printing, networking, and business systems.',
  content = jsonb_set(
    COALESCE(content, '{}'::jsonb),
    '{secondaryCta}',
    to_jsonb('How we evaluate'::text),
    true
  ),
  updated_at = NOW()
WHERE slug = 'home';
