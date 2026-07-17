UPDATE public.site_pages
SET content = jsonb_set(
  content::jsonb,
  '{heroEvaluation}',
  '[
    {
      "title": "Compatibility",
      "description": "Does it work with the systems businesses already use?"
    },
    {
      "title": "Setup",
      "description": "How much time and technical effort does deployment require?"
    },
    {
      "title": "Reliability",
      "description": "How does it handle daily operation, reconnection, and failure?"
    },
    {
      "title": "Value",
      "description": "What is the real cost after accessories and subscriptions?"
    }
  ]'::jsonb,
  true
)
WHERE slug = 'home';
