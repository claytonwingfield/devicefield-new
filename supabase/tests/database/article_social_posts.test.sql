BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(15);

CREATE OR REPLACE FUNCTION pg_temp.social_article(p_slug TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'title', 'Social draft test ' || p_slug,
    'slug', p_slug,
    'excerpt', 'A database test for private article social drafts.',
    'content', E'## Social drafts\n\nEditorial social-copy coverage.',
    'category', 'Troubleshooting',
    'tags', '[]'::jsonb,
    'cover_image_url', 'https://example.com/' || p_slug || '-one.webp',
    'cover_image_alt', 'First social draft test cover',
    'focus_keyword', 'social draft test',
    'seo_title', 'Social draft database test',
    'meta_description', 'Database coverage for private article social drafts.',
    'canonical_url', 'https://devicefield.com/blog/' || p_slug,
    'faq_items', '[]'::jsonb,
    'article_type', 'troubleshooting',
    'testing_status', 'researched',
    'author_slug', 'social-test-author',
    'reviewer_slug', 'social-test-reviewer',
    'last_verified_at', '2026-07-18T12:00:00.000Z',
    'next_review_at', '2027-07-18T12:00:00.000Z',
    'sources', '[]'::jsonb,
    'claims', '[]'::jsonb,
    'quick_verdict', '{}'::jsonb,
    'compatibility_notes', 'Compatibility notes.',
    'limitations', 'Research limitations.',
    'testing_method', 'Documentation review.',
    'original_evidence', '[]'::jsonb,
    'featured', false
  );
$$;

CREATE OR REPLACE FUNCTION pg_temp.social_covers(p_slug TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_array(
    jsonb_build_object(
      'image_url', 'https://example.com/' || p_slug || '-one.webp',
      'image_alt', 'First social draft test cover',
      'label', 'First concept',
      'display_order', 0,
      'selected', true
    ),
    jsonb_build_object(
      'image_url', 'https://example.com/' || p_slug || '-two.webp',
      'image_alt', 'Second social draft test cover',
      'label', 'Second concept',
      'display_order', 1,
      'selected', false
    ),
    jsonb_build_object(
      'image_url', 'https://example.com/' || p_slug || '-three.webp',
      'image_alt', 'Third social draft test cover',
      'label', 'Third concept',
      'display_order', 2,
      'selected', false
    )
  );
$$;

CREATE OR REPLACE FUNCTION pg_temp.social_drafts(p_slug TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_array(
    jsonb_build_object(
      'platform', 'x',
      'content', 'New Devicefield guide: https://devicefield.com/blog/' || p_slug
    ),
    jsonb_build_object(
      'platform', 'facebook',
      'content', 'Read the practical Devicefield guide: https://devicefield.com/blog/' || p_slug
    ),
    jsonb_build_object(
      'platform', 'instagram',
      'content', 'A practical researched guide. Link in bio. Reference: https://devicefield.com/blog/' || p_slug
    )
  );
$$;

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
    '45000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'social-admin@devicefield.test',
    '', NOW(), '{}', '{}', NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '45000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'social-reader@devicefield.test',
    '', NOW(), '{}', '{}', NOW(), NOW(), '', '', '', ''
  );

UPDATE public.profiles
SET role = 'admin'
WHERE id = '45000000-0000-0000-0000-000000000001';

INSERT INTO public.authors (id, slug, name)
VALUES
  ('45000000-0000-0000-0000-000000000011', 'social-test-author', 'Social test author'),
  ('45000000-0000-0000-0000-000000000012', 'social-test-reviewer', 'Social test reviewer');

CREATE TEMP TABLE social_ingest_result (
  id UUID NOT NULL,
  slug TEXT NOT NULL,
  workflow_status TEXT NOT NULL
);
GRANT SELECT, INSERT ON social_ingest_result TO service_role, authenticated;

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'service role can execute social-draft ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute social-draft ingestion'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.create_codex_review_draft(text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot execute social-draft ingestion'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.article_social_posts', 'SELECT'),
  'anonymous clients cannot read private social drafts'
);

SET LOCAL ROLE service_role;
INSERT INTO social_ingest_result
SELECT id, slug, workflow_status
FROM public.create_codex_review_draft(
  'social-drafts-valid-001',
  repeat('a', 64),
  repeat('b', 64),
  pg_temp.social_article('social-drafts-valid-test'),
  '[]'::jsonb,
  '[]'::jsonb,
  pg_temp.social_covers('social-drafts-valid-test'),
  pg_temp.social_drafts('social-drafts-valid-test')
);
RESET ROLE;

SELECT is(
  (SELECT workflow_status FROM social_ingest_result LIMIT 1),
  'ready_for_review',
  'social-draft ingestion remains review gated'
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_social_posts
    WHERE article_id = (SELECT id FROM social_ingest_result LIMIT 1)
  ),
  3::BIGINT,
  'all three social drafts are inserted atomically'
);
SELECT is(
  (
    SELECT content
    FROM public.article_social_posts
    WHERE article_id = (SELECT id FROM social_ingest_result LIMIT 1)
      AND platform = 'x'
  ),
  'New Devicefield guide: https://devicefield.com/blog/social-drafts-valid-test',
  'the X draft is stored with the article URL'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '45000000-0000-0000-0000-000000000001',
  true
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_social_posts
    WHERE article_id = (SELECT id FROM social_ingest_result LIMIT 1)
  ),
  3::BIGINT,
  'admin can read all article social drafts'
);
SELECT lives_ok(
  format(
    'UPDATE public.article_social_posts SET content = %L WHERE article_id = %L AND platform = %L',
    'Updated X copy: https://devicefield.com/blog/social-drafts-valid-test',
    (SELECT id FROM social_ingest_result LIMIT 1),
    'x'
  ),
  'admin can update a social draft'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '45000000-0000-0000-0000-000000000002',
  true
);
SELECT is(
  (
    SELECT COUNT(*)
    FROM public.article_social_posts
    WHERE article_id = (SELECT id FROM social_ingest_result LIMIT 1)
  ),
  0::BIGINT,
  'non-admin users cannot read social drafts'
);
RESET ROLE;

SELECT is(
  (
    SELECT content
    FROM public.article_social_posts
    WHERE article_id = (SELECT id FROM social_ingest_result LIMIT 1)
      AND platform = 'x'
  ),
  'Updated X copy: https://devicefield.com/blog/social-drafts-valid-test',
  'the admin update was persisted'
);

SET LOCAL ROLE service_role;
SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'social-drafts-missing-001', repeat('c', 64), repeat('d', 64),
      pg_temp.social_article('social-drafts-missing-test'),
      '[]'::jsonb,
      '[]'::jsonb,
      pg_temp.social_covers('social-drafts-missing-test'),
      jsonb_build_array(
        jsonb_build_object('platform', 'x', 'content', 'https://devicefield.com/blog/social-drafts-missing-test'),
        jsonb_build_object('platform', 'facebook', 'content', 'https://devicefield.com/blog/social-drafts-missing-test')
      )
    )
  $$,
  'P0001',
  'Exactly three social drafts are required',
  'ingestion rejects incomplete social drafts'
);
RESET ROLE;

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.blog_posts
    WHERE slug = 'social-drafts-missing-test'
  ),
  0::BIGINT,
  'incomplete social drafts cannot leave an article behind'
);

SET LOCAL ROLE service_role;
SELECT throws_ok(
  $$
    SELECT * FROM public.create_codex_review_draft(
      'social-drafts-url-001', repeat('e', 64), repeat('f', 64),
      pg_temp.social_article('social-drafts-url-test'),
      '[]'::jsonb,
      '[]'::jsonb,
      pg_temp.social_covers('social-drafts-url-test'),
      jsonb_build_array(
        jsonb_build_object('platform', 'x', 'content', 'Missing URL'),
        jsonb_build_object('platform', 'facebook', 'content', 'https://devicefield.com/blog/social-drafts-url-test'),
        jsonb_build_object('platform', 'instagram', 'content', 'Link in bio. https://devicefield.com/blog/social-drafts-url-test')
      )
    )
  $$,
  'P0001',
  'Social draft must include the canonical article URL',
  'ingestion rejects social copy without the canonical URL'
);
RESET ROLE;

SELECT is(
  (
    SELECT COUNT(*)
    FROM public.blog_posts
    WHERE slug = 'social-drafts-url-test'
  ),
  0::BIGINT,
  'invalid social copy is rejected before article creation'
);

SELECT * FROM finish();
ROLLBACK;
