BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(17);

CREATE OR REPLACE FUNCTION pg_temp.codex_payload(
  p_slug TEXT,
  p_testing_status TEXT DEFAULT 'researched'
)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'title', 'Codex review draft ' || p_slug,
    'slug', p_slug,
    'excerpt', 'A researched database ingestion test.',
    'content', '## Test draft\n\nDatabase ingestion coverage.',
    'category', 'Troubleshooting',
    'tags', jsonb_build_array('database-test'),
    'cover_image_url', 'https://example.com/' || p_slug || '.webp',
    'cover_image_alt', 'Database test illustration',
    'focus_keyword', 'database ingestion test',
    'seo_title', 'Database ingestion test',
    'meta_description', 'Database ingestion test description.',
    'canonical_url', 'https://devicefield.com/blog/' || p_slug,
    'faq_items', '[]'::jsonb,
    'article_type', 'troubleshooting',
    'testing_status', p_testing_status,
    'author_slug', 'test-codex-author',
    'reviewer_slug', 'test-codex-reviewer',
    'last_verified_at', '2026-07-17T12:00:00.000Z',
    'next_review_at', '2027-07-17T12:00:00.000Z',
    'sources', '[]'::jsonb,
    'claims', '[]'::jsonb,
    'quick_verdict', '{}'::jsonb,
    'compatibility_notes', 'Compatibility notes.',
    'limitations', 'Research limitations.',
    'testing_method', 'Documentation review.',
    'original_evidence', '[]'::jsonb,
    'featured', false,
    'internal_notes', 'Database test.'
  );
$$;

CREATE TEMP TABLE codex_ingest_results (
  id UUID NOT NULL,
  slug TEXT NOT NULL,
  workflow_status TEXT NOT NULL
);
GRANT SELECT, INSERT ON codex_ingest_results TO service_role;

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'service role can execute review-draft ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute review-draft ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot execute review-draft ingestion'
);

SET LOCAL ROLE service_role;

INSERT INTO public.authors (id, slug, name)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'test-codex-author', 'Test author'),
  ('30000000-0000-0000-0000-000000000002', 'test-codex-reviewer', 'Test reviewer');

INSERT INTO public.affiliate_programs (id, name, network, status)
VALUES
  ('31000000-0000-0000-0000-000000000001', 'Approved Codex program', 'direct', 'approved'),
  ('31000000-0000-0000-0000-000000000002', 'Pending Codex program', 'direct', 'approved'),
  ('31000000-0000-0000-0000-000000000003', 'Rejected Codex program', 'direct', 'approved'),
  ('31000000-0000-0000-0000-000000000004', 'Paused Codex program', 'direct', 'approved');

INSERT INTO public.affiliate_links (
  id,
  slug,
  label,
  program_id,
  destination_url,
  active
)
VALUES
  ('32000000-0000-0000-0000-000000000001', 'codex-approved-link', 'Approved', '31000000-0000-0000-0000-000000000001', 'https://example.com/approved', true),
  ('32000000-0000-0000-0000-000000000002', 'codex-pending-link', 'Pending', '31000000-0000-0000-0000-000000000002', 'https://example.com/pending', true),
  ('32000000-0000-0000-0000-000000000003', 'codex-rejected-link', 'Rejected', '31000000-0000-0000-0000-000000000003', 'https://example.com/rejected', true),
  ('32000000-0000-0000-0000-000000000004', 'codex-paused-link', 'Paused', '31000000-0000-0000-0000-000000000004', 'https://example.com/paused', true),
  ('32000000-0000-0000-0000-000000000005', 'codex-inactive-link', 'Inactive', '31000000-0000-0000-0000-000000000001', 'https://example.com/inactive', false);

UPDATE public.affiliate_programs
SET status = CASE id
  WHEN '31000000-0000-0000-0000-000000000002' THEN 'pending'
  WHEN '31000000-0000-0000-0000-000000000003' THEN 'rejected'
  WHEN '31000000-0000-0000-0000-000000000004' THEN 'paused'
  ELSE status
END
WHERE id IN (
  '31000000-0000-0000-0000-000000000002',
  '31000000-0000-0000-0000-000000000003',
  '31000000-0000-0000-0000-000000000004'
);

INSERT INTO codex_ingest_results
SELECT id, slug, workflow_status
FROM public.create_codex_review_draft(
  'codex-run-valid-001',
  repeat('a', 64),
  repeat('b', 64),
  pg_temp.codex_payload('test-codex-ready-review'),
  jsonb_build_array(jsonb_build_object(
    'affiliate_link_slug', 'codex-approved-link',
    'product_name', 'Approved product',
    'placement', 'recommendation',
    'display_order', 0,
    'pros', jsonb_build_array('Documented compatibility'),
    'cons', jsonb_build_array('Requires verification')
  ))
);

SELECT ok(
  (
    SELECT blog_post.workflow_status = 'ready_for_review'
      AND blog_post.status = 'draft'
      AND blog_post.featured = false
      AND blog_post.approved_at IS NULL
      AND blog_post.published_at IS NULL
      AND blog_post.scheduled_for IS NULL
      AND blog_post.author_id = '30000000-0000-0000-0000-000000000001'
      AND blog_post.reviewer_id = '30000000-0000-0000-0000-000000000002'
    FROM public.blog_posts AS blog_post
    WHERE blog_post.slug = 'test-codex-ready-review'
  ),
  'new ingestion always creates an unapproved ready-for-review draft'
);

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_products AS product
    JOIN public.affiliate_links AS affiliate_link
      ON affiliate_link.id = product.affiliate_link_id
    WHERE product.article_id = (
      SELECT id FROM codex_ingest_results LIMIT 1
    ) AND affiliate_link.slug = 'codex-approved-link'
  ),
  1::BIGINT,
  'approved active product recommendations are inserted atomically'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-duplicate-slug', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-ready-review'), '[]'::jsonb
    )
  $$,
  'P0001',
  'Article slug already exists',
  'a duplicate slug is rejected'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-valid-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-duplicate-run'), '[]'::jsonb
    )
  $$,
  'P0001',
  'Codex run ID has already been submitted',
  'a duplicate run ID is rejected'
);

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.blog_posts
    WHERE slug IN ('test-codex-ready-review', 'test-codex-duplicate-run')
  ),
  1::BIGINT,
  'duplicate requests do not create a second article'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-workflow-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-workflow') || '{"workflow_status":"published"}'::jsonb,
      '[]'::jsonb
    )
  $$,
  'P0001',
  'Codex ingestion cannot set editorial workflow fields',
  'caller-supplied workflow fields are rejected'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-tested-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-tested', 'tested'), '[]'::jsonb
    )
  $$,
  'P0001',
  'Tested or mixed drafts require original evidence',
  'tested content without evidence is rejected'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-claim-001', repeat('c', 64), repeat('d', 64),
      jsonb_set(
        pg_temp.codex_payload('test-codex-high-risk'),
        '{claims}',
        '[{"claim":"Risk claim","risk":"high","resolved":false}]'::jsonb
      ),
      '[]'::jsonb
    )
  $$,
  'P0001',
  'Unresolved high-risk claims are not allowed',
  'unresolved high-risk claims are rejected'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-category-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-category') || '{"category":"AI Tools"}'::jsonb,
      '[]'::jsonb
    )
  $$,
  'P0001',
  'Draft category is invalid',
  'unknown categories are rejected'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-pending-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-pending-product'),
      '[{"affiliate_link_slug":"codex-pending-link","product_name":"Pending"}]'::jsonb
    )
  $$,
  'P0001',
  'Article product affiliate link is unavailable',
  'pending affiliate programs cannot be recommended'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-rejected-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-rejected-product'),
      '[{"affiliate_link_slug":"codex-rejected-link","product_name":"Rejected"}]'::jsonb
    )
  $$,
  'P0001',
  'Article product affiliate link is unavailable',
  'rejected affiliate programs cannot be recommended'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-paused-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-paused-product'),
      '[{"affiliate_link_slug":"codex-paused-link","product_name":"Paused"}]'::jsonb
    )
  $$,
  'P0001',
  'Article product affiliate link is unavailable',
  'paused affiliate programs cannot be recommended'
);

SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'codex-run-inactive-001', repeat('c', 64), repeat('d', 64),
      pg_temp.codex_payload('test-codex-inactive-product'),
      '[{"affiliate_link_slug":"codex-inactive-link","product_name":"Inactive"}]'::jsonb
    )
  $$,
  'P0001',
  'Article product affiliate link is unavailable',
  'inactive affiliate links cannot be recommended'
);

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.blog_posts
    WHERE slug LIKE 'test-codex-%-product'
  ),
  0::BIGINT,
  'invalid product recommendations roll back the entire article transaction'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
