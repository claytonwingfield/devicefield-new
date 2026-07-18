INSERT INTO public.site_pages (slug, title, meta_description, content)
VALUES (
  'search',
  'Search Devicefield Business Technology Guides',
  'Search Devicefield buying guides, product reviews, comparisons, compatibility notes, setup guides, and troubleshooting articles.',
  jsonb_build_object(
    'eyebrow', 'Search Devicefield',
    'heading', 'Find the right field note.',
    'intro', 'Search independent buying guides, reviews, comparisons, setup notes, compatibility guidance, and troubleshooting articles.',
    'resultsEyebrow', 'Published coverage',
    'emptyHeading', 'Try a broader search.',
    'emptyIntro', 'Remove one or more filters, check the spelling, or browse all currently published guides.'
  )
)
ON CONFLICT (slug) DO NOTHING;
