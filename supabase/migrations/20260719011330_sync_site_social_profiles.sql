UPDATE public.site_pages
SET
  content = jsonb_set(
    COALESCE(content, '{}'::jsonb),
    '{socialProfiles}',
    '[
      {"href": "https://x.com/devicefieldhq", "label": "X"},
      {"href": "https://www.instagram.com/devicefieldhq/", "label": "Instagram"},
      {"href": "https://www.facebook.com/profile.php?id=100095303211875", "label": "Facebook"}
    ]'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE slug = 'global';
