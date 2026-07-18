BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(15);

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '44000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'cover-admin@devicefield.test',
    '', NOW(), '{}', '{}', NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'cover-author@devicefield.test',
    '', NOW(), '{}', '{}', NOW(), NOW(), '', '', '', ''
  );

UPDATE public.profiles
SET role = 'admin'
WHERE id = '44000000-0000-0000-0000-000000000001';

INSERT INTO public.authors (id, slug, name)
VALUES
  ('44000000-0000-0000-0000-000000000011', 'cover-test-author', 'Cover test author'),
  ('44000000-0000-0000-0000-000000000012', 'cover-test-reviewer', 'Cover test reviewer');

CREATE TEMP TABLE cover_ingest_result (
  id UUID NOT NULL,
  slug TEXT NOT NULL,
  workflow_status TEXT NOT NULL
);
GRANT SELECT, INSERT ON cover_ingest_result TO service_role, authenticated;

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'service role can execute three-cover ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute three-cover ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot execute three-cover ingestion'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.article_cover_images', 'SELECT'),
  'anonymous clients cannot read private cover choices'
);

SET LOCAL ROLE service_role;

INSERT INTO cover_ingest_result
SELECT id, slug, workflow_status
FROM public.create_codex_review_draft(
  'cover-options-valid-001',
  repeat('a', 64),
  repeat('b', 64),
  jsonb_build_object(
    'title', 'Three cover option test',
    'slug', 'three-cover-option-test',
    'excerpt', 'A database test for private article cover choices.',
    'content', E'## Cover options\n\nEditorial selection test.',
    'category', 'Troubleshooting',
    'tags', '[]'::jsonb,
    'cover_image_url', 'https://example.com/cover-one.webp',
    'cover_image_alt', 'First technical cover concept',
    'article_type', 'troubleshooting',
    'testing_status', 'researched',
    'author_slug', 'cover-test-author',
    'reviewer_slug', 'cover-test-reviewer',
    'last_verified_at', '2026-07-18T12:00:00.000Z',
    'next_review_at', '2027-07-18T12:00:00.000Z',
    'sources', '[]'::jsonb,
    'claims', '[]'::jsonb,
    'quick_verdict', '{}'::jsonb,
    'original_evidence', '[]'::jsonb,
    'featured', false
  ),
  '[]'::jsonb,
  '[]'::jsonb,
  jsonb_build_array(
    jsonb_build_object(
      'image_url', 'https://example.com/cover-one.webp',
      'image_alt', 'First technical cover concept',
      'label', 'Connection diagram',
      'display_order', 0,
      'selected', true
    ),
    jsonb_build_object(
      'image_url', 'https://example.com/cover-two.webp',
      'image_alt', 'Second technical cover concept',
      'label', 'Workflow concept',
      'display_order', 1,
      'selected', false
    ),
    jsonb_build_object(
      'image_url', 'https://example.com/cover-three.webp',
      'image_alt', 'Third technical cover concept',
      'label', 'Compatibility concept',
      'display_order', 2,
      'selected', false
    )
  )
);

RESET ROLE;

SELECT is(
  (SELECT workflow_status FROM cover_ingest_result LIMIT 1),
  'ready_for_review',
  'three-cover ingestion remains review gated'
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_cover_images
    WHERE article_id = (SELECT id FROM cover_ingest_result LIMIT 1)
  ),
  3::BIGINT,
  'three private cover choices are inserted atomically'
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_cover_images
    WHERE article_id = (SELECT id FROM cover_ingest_result LIMIT 1)
      AND selected
  ),
  1::BIGINT,
  'exactly one cover choice starts selected'
);
SELECT is(
  (
    SELECT cover_image_url
    FROM public.blog_posts
    WHERE id = (SELECT id FROM cover_ingest_result LIMIT 1)
  ),
  'https://example.com/cover-one.webp',
  'the selected option is stored on the article'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '44000000-0000-0000-0000-000000000001',
  true
);

SELECT lives_ok(
  format(
    'SELECT public.select_article_cover_image(%L, %L)',
    (SELECT id FROM cover_ingest_result LIMIT 1),
    (
      SELECT id
      FROM public.article_cover_images
      WHERE article_id = (SELECT id FROM cover_ingest_result LIMIT 1)
        AND display_order = 1
    )
  ),
  'admin can select another cover option'
);
SELECT ok(
  (
    SELECT post.cover_image_url = 'https://example.com/cover-two.webp'
      AND post.cover_image_alt = 'Second technical cover concept'
      AND cover.selected
    FROM public.blog_posts AS post
    JOIN public.article_cover_images AS cover
      ON cover.article_id = post.id
      AND cover.display_order = 1
    WHERE post.id = (SELECT id FROM cover_ingest_result LIMIT 1)
  ),
  'selection updates the article URL, alt text, and selected option together'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '44000000-0000-0000-0000-000000000002',
  true
);
SELECT throws_ok(
  format(
    'SELECT public.select_article_cover_image(%L, %L)',
    (SELECT id FROM cover_ingest_result LIMIT 1),
    (
      SELECT id
      FROM public.article_cover_images
      WHERE article_id = (SELECT id FROM cover_ingest_result LIMIT 1)
        AND display_order = 2
    )
  ),
  'P0001',
  'Admin access required',
  'non-admin users cannot select cover options'
);

RESET ROLE;
UPDATE public.blog_posts
SET
  workflow_status = 'approved',
  approved_at = NOW(),
  reviewed_at = NOW(),
  last_reviewed_at = NOW()
WHERE id = (SELECT id FROM cover_ingest_result LIMIT 1);
UPDATE public.blog_posts
SET
  workflow_status = 'published',
  status = 'published',
  published_at = NOW()
WHERE id = (SELECT id FROM cover_ingest_result LIMIT 1);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '44000000-0000-0000-0000-000000000001',
  true
);
SELECT throws_ok(
  format(
    'SELECT public.select_article_cover_image(%L, %L)',
    (SELECT id FROM cover_ingest_result LIMIT 1),
    (
      SELECT id
      FROM public.article_cover_images
      WHERE article_id = (SELECT id FROM cover_ingest_result LIMIT 1)
        AND display_order = 2
    )
  ),
  'P0001',
  'Published articles must be unpublished before changing the cover image',
  'published cover choices remain locked'
);

RESET ROLE;
SET LOCAL ROLE service_role;
SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'cover-options-invalid-001', repeat('c', 64), repeat('d', 64),
      jsonb_build_object(
        'title', 'Invalid cover option test',
        'slug', 'invalid-cover-option-test',
        'excerpt', 'An invalid cover option transaction test.',
        'content', E'## Invalid covers\n\nRollback coverage.',
        'category', 'Troubleshooting',
        'tags', '[]'::jsonb,
        'cover_image_url', 'https://example.com/invalid-one.webp',
        'cover_image_alt', 'Invalid first cover option',
        'article_type', 'troubleshooting',
        'testing_status', 'researched',
        'author_slug', 'cover-test-author',
        'reviewer_slug', 'cover-test-reviewer',
        'last_verified_at', '2026-07-18T12:00:00.000Z',
        'next_review_at', '2027-07-18T12:00:00.000Z',
        'sources', '[]'::jsonb,
        'claims', '[]'::jsonb,
        'quick_verdict', '{}'::jsonb,
        'original_evidence', '[]'::jsonb,
        'featured', false
      ),
      '[]'::jsonb,
      '[]'::jsonb,
      '[{"image_url":"https://example.com/invalid-one.webp","image_alt":"Invalid first cover option","label":"One","display_order":0,"selected":true}]'::jsonb
    )
  $$,
  'P0001',
  'Exactly three cover image options are required',
  'ingestion rejects fewer than three cover choices'
);
RESET ROLE;

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.blog_posts
    WHERE slug = 'invalid-cover-option-test'
  ),
  0::BIGINT,
  'invalid cover choices cannot leave an article behind'
);

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_cover_images
    WHERE article_id = (SELECT id FROM cover_ingest_result LIMIT 1)
      AND selected
  ),
  1::BIGINT,
  'cover selection always remains singular'
);

SELECT * FROM finish();
ROLLBACK;
