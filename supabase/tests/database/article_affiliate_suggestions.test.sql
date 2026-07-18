BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(9);

CREATE TEMP TABLE suggestion_ingest_result (
  id UUID NOT NULL,
  slug TEXT NOT NULL,
  workflow_status TEXT NOT NULL
);
GRANT SELECT, INSERT ON suggestion_ingest_result TO service_role;

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'service role can execute suggestion-aware ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute suggestion-aware ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot execute suggestion-aware ingestion'
);

INSERT INTO public.authors (id, slug, name)
VALUES
  ('33000000-0000-0000-0000-000000000001', 'suggestion-test-author', 'Suggestion test author'),
  ('33000000-0000-0000-0000-000000000002', 'suggestion-test-reviewer', 'Suggestion test reviewer');

SET LOCAL ROLE service_role;

INSERT INTO suggestion_ingest_result
SELECT id, slug, workflow_status
FROM public.create_codex_review_draft(
  'suggestion-run-valid-001',
  repeat('a', 64),
  repeat('b', 64),
  jsonb_build_object(
    'title', 'Suggestion ingestion test',
    'slug', 'suggestion-ingestion-test',
    'excerpt', 'A private affiliate suggestion test.',
    'content', E'## Connection options\n\nCompare the documented interfaces.',
    'category', 'Receipt & Label Printing',
    'tags', jsonb_build_array('database-test'),
    'cover_image_url', 'https://example.com/suggestion-test.webp',
    'cover_image_alt', 'Receipt printer connection diagram',
    'article_type', 'compatibility_guide',
    'testing_status', 'researched',
    'author_slug', 'suggestion-test-author',
    'reviewer_slug', 'suggestion-test-reviewer',
    'last_verified_at', '2026-07-18T12:00:00.000Z',
    'next_review_at', '2027-07-18T12:00:00.000Z',
    'sources', '[]'::jsonb,
    'claims', '[]'::jsonb,
    'quick_verdict', '{}'::jsonb,
    'original_evidence', '[]'::jsonb,
    'featured', false
  ),
  jsonb_build_array(jsonb_build_object(
    'affiliate_link_slug', NULL,
    'product_name', 'Researched printer candidate',
    'best_for', 'Fixed checkout counters',
    'avoid_if', 'Mobile printing is required',
    'verdict', 'Review this recommendation before publication.',
    'pros', jsonb_build_array('Documented wired interface'),
    'cons', jsonb_build_array('Not tested by Devicefield'),
    'placement', 'recommendation',
    'display_order', 0
  )),
  jsonb_build_array(jsonb_build_object(
    'program_name', 'Example partner program',
    'network', 'direct',
    'program_url', 'https://example.com/partners',
    'product_name', 'Researched printer candidate',
    'evidence_url', 'https://example.com/affiliate-program',
    'evidence_checked_at', '2026-07-18T12:00:00.000Z',
    'rationale', 'The merchant carries the article product.',
    'target_heading', 'Connection options',
    'suggested_placement', 'after_section',
    'insertion_note', 'Add a product card after the comparison.',
    'suggested_cta', 'Check current pricing',
    'display_order', 0
  ))
);

RESET ROLE;

SELECT is(
  (SELECT workflow_status FROM suggestion_ingest_result LIMIT 1),
  'ready_for_review',
  'suggestion-aware ingestion remains review gated'
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_affiliate_suggestions
    WHERE article_id = (SELECT id FROM suggestion_ingest_result LIMIT 1)
      AND review_status = 'pending'
      AND target_heading = 'Connection options'
  ),
  1::BIGINT,
  'private affiliate suggestion is inserted atomically'
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_products
    WHERE article_id = (SELECT id FROM suggestion_ingest_result LIMIT 1)
      AND affiliate_link_id IS NULL
  ),
  1::BIGINT,
  'unlinked structured recommendation is inserted for admin review'
);
SELECT ok(
  NOT has_table_privilege(
    'anon',
    'public.article_affiliate_suggestions',
    'SELECT'
  ),
  'anonymous clients cannot read affiliate suggestions'
);

SET LOCAL ROLE service_role;
SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'suggestion-run-invalid-001', repeat('c', 64), repeat('d', 64),
      jsonb_build_object(
        'title', 'Invalid suggestion ingestion test',
        'slug', 'invalid-suggestion-ingestion-test',
        'excerpt', 'A rollback test.',
        'content', E'## Existing heading\n\nArticle content.',
        'category', 'Troubleshooting',
        'tags', '[]'::jsonb,
        'cover_image_url', 'https://example.com/invalid.webp',
        'cover_image_alt', 'Troubleshooting connection diagram',
        'article_type', 'troubleshooting',
        'testing_status', 'researched',
        'author_slug', 'suggestion-test-author',
        'reviewer_slug', 'suggestion-test-reviewer',
        'last_verified_at', '2026-07-18T12:00:00.000Z',
        'next_review_at', '2027-07-18T12:00:00.000Z',
        'sources', '[]'::jsonb,
        'claims', '[]'::jsonb,
        'quick_verdict', '{}'::jsonb,
        'original_evidence', '[]'::jsonb,
        'featured', false
      ),
      '[]'::jsonb,
      '[{"program_name":"Example","network":"direct","program_url":"https://example.com/partners","evidence_url":"https://example.com/evidence","evidence_checked_at":"2026-07-18T12:00:00Z","rationale":"Relevant program.","target_heading":"Missing heading","suggested_placement":"within_section","insertion_note":"Add here.","display_order":0}]'::jsonb
    )
  $$,
  'P0001',
  'Affiliate suggestion target heading is not in the article',
  'suggestions cannot target a nonexistent heading'
);
RESET ROLE;

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.blog_posts
    WHERE slug = 'invalid-suggestion-ingestion-test'
  ),
  0::BIGINT,
  'invalid suggestion input cannot leave an article row behind'
);

SELECT * FROM finish();
ROLLBACK;
