BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(16);

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
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'workflow-admin@devicefield.test',
    '',
    NOW(),
    '{}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'workflow-author@devicefield.test',
    '',
    NOW(),
    '{}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

UPDATE public.profiles
SET role = 'admin'
WHERE id = '00000000-0000-0000-0000-000000000001';

CREATE OR REPLACE FUNCTION pg_temp.article_payload(p_slug TEXT, p_title TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'title', p_title,
    'slug', p_slug,
    'excerpt', 'Database workflow test article.',
    'content', '## Test article\n\nDatabase workflow coverage.',
    'category', 'Troubleshooting',
    'tags', '[]'::jsonb,
    'faq_items', '[]'::jsonb,
    'article_type', 'troubleshooting',
    'testing_status', 'researched',
    'sources', '[]'::jsonb,
    'claims', '[]'::jsonb,
    'quick_verdict', '{}'::jsonb,
    'original_evidence', '[]'::jsonb,
    'featured', false
  );
$$;

CREATE TEMP TABLE workflow_test_articles (
  name TEXT PRIMARY KEY,
  id UUID NOT NULL
);

GRANT SELECT, INSERT ON workflow_test_articles TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

INSERT INTO workflow_test_articles
SELECT
  'primary',
  (public.persist_article_workflow(
    NULL,
    pg_temp.article_payload('test-workflow-primary', 'Original title'),
    'save_draft',
    NULL
  )).id;

SELECT throws_ok(
  $$
    SELECT public.persist_article_workflow(
      (SELECT id FROM workflow_test_articles WHERE name = 'primary'),
      pg_temp.article_payload('test-workflow-primary', 'Unreviewed title'),
      'publish',
      NULL
    )
  $$,
  'P0001',
  'Only approved or scheduled articles can be published',
  'draft cannot publish'
);

SELECT is(
  (SELECT title FROM public.blog_posts WHERE id = (
    SELECT id FROM workflow_test_articles WHERE name = 'primary'
  )),
  'Original title',
  'failed workflow action rolls back content changes'
);

SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'primary'),
  pg_temp.article_payload('test-workflow-primary', 'Original title'),
  'mark_ready',
  NULL
);

SELECT throws_ok(
  $$
    SELECT public.persist_article_workflow(
      (SELECT id FROM workflow_test_articles WHERE name = 'primary'),
      pg_temp.article_payload('test-workflow-primary', 'Original title'),
      'publish',
      NULL
    )
  $$,
  'P0001',
  'Only approved or scheduled articles can be published',
  'ready-for-review cannot publish'
);

SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'primary'),
  pg_temp.article_payload('test-workflow-primary', 'Original title'),
  'approve',
  NULL
);

SELECT lives_ok(
  format(
    'SELECT public.persist_article_workflow(%L, %L::jsonb, %L, NULL)',
    (SELECT id FROM workflow_test_articles WHERE name = 'primary'),
    pg_temp.article_payload('test-workflow-primary', 'Original title')::TEXT,
    'publish'
  ),
  'approved can publish'
);

INSERT INTO workflow_test_articles
SELECT
  'scheduled_publish',
  (public.persist_article_workflow(
    NULL,
    pg_temp.article_payload('test-workflow-scheduled-publish', 'Scheduled publish'),
    'save_draft',
    NULL
  )).id;

SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'scheduled_publish'),
  pg_temp.article_payload('test-workflow-scheduled-publish', 'Scheduled publish'),
  'mark_ready',
  NULL
);
SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'scheduled_publish'),
  pg_temp.article_payload('test-workflow-scheduled-publish', 'Scheduled publish'),
  'approve',
  NULL
);

SELECT lives_ok(
  format(
    'SELECT public.persist_article_workflow(%L, %L::jsonb, %L, NOW() + INTERVAL ''1 day'')',
    (SELECT id FROM workflow_test_articles WHERE name = 'scheduled_publish'),
    pg_temp.article_payload('test-workflow-scheduled-publish', 'Scheduled publish')::TEXT,
    'schedule'
  ),
  'approved can schedule'
);

SELECT is(
  (SELECT workflow_status FROM public.blog_posts WHERE id = (
    SELECT id FROM workflow_test_articles WHERE name = 'scheduled_publish'
  )),
  'scheduled',
  'scheduling records the scheduled workflow state'
);

SELECT lives_ok(
  format(
    'SELECT public.persist_article_workflow(%L, %L::jsonb, %L, NULL)',
    (SELECT id FROM workflow_test_articles WHERE name = 'scheduled_publish'),
    pg_temp.article_payload('test-workflow-scheduled-publish', 'Scheduled publish')::TEXT,
    'publish'
  ),
  'scheduled can publish'
);

SELECT ok(
  (SELECT workflow_status = 'published'
    AND published_at IS NOT NULL
    AND scheduled_for IS NULL
   FROM public.blog_posts
   WHERE id = (
     SELECT id FROM workflow_test_articles WHERE name = 'scheduled_publish'
   )),
  'publishing sets published_at and clears scheduled_for'
);

INSERT INTO workflow_test_articles
SELECT
  'unschedule',
  (public.persist_article_workflow(
    NULL,
    pg_temp.article_payload('test-workflow-unschedule', 'Unschedule'),
    'save_draft',
    NULL
  )).id;
SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'unschedule'),
  pg_temp.article_payload('test-workflow-unschedule', 'Unschedule'),
  'mark_ready',
  NULL
);
SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'unschedule'),
  pg_temp.article_payload('test-workflow-unschedule', 'Unschedule'),
  'approve',
  NULL
);
SELECT public.persist_article_workflow(
  (SELECT id FROM workflow_test_articles WHERE name = 'unschedule'),
  pg_temp.article_payload('test-workflow-unschedule', 'Unschedule'),
  'schedule',
  NOW() + INTERVAL '1 day'
);

SELECT lives_ok(
  format(
    'SELECT public.persist_article_workflow(%L, %L::jsonb, %L, NULL)',
    (SELECT id FROM workflow_test_articles WHERE name = 'unschedule'),
    pg_temp.article_payload('test-workflow-unschedule', 'Unschedule')::TEXT,
    'unschedule'
  ),
  'scheduled can return to approved'
);

SELECT ok(
  (SELECT workflow_status = 'approved'
    AND approved_at IS NOT NULL
    AND reviewed_at IS NOT NULL
    AND last_reviewed_at IS NOT NULL
    AND published_at IS NULL
    AND scheduled_for IS NULL
   FROM public.blog_posts
   WHERE id = (SELECT id FROM workflow_test_articles WHERE name = 'unschedule')),
  'approval timestamps are set and schedule timestamp is cleared'
);

INSERT INTO workflow_test_articles
SELECT
  'author_attempt',
  (public.persist_article_workflow(
    NULL,
    pg_temp.article_payload('test-workflow-author', 'Author attempt'),
    'save_draft',
    NULL
  )).id;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);

SELECT throws_ok(
  $$
    SELECT public.persist_article_workflow(
      (SELECT id FROM workflow_test_articles WHERE name = 'author_attempt'),
      pg_temp.article_payload('test-workflow-author', 'Author attempt'),
      'mark_ready',
      NULL
    )
  $$,
  'P0001',
  'Admin access required',
  'non-admin cannot transition articles'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

SELECT throws_ok(
  format(
    'UPDATE public.blog_posts SET title = %L WHERE id = %L',
    'Bypassed review',
    (SELECT id FROM workflow_test_articles WHERE name = 'primary')
  ),
  'P0001',
  'Published articles must be unpublished before content editing',
  'editing a published article cannot bypass review'
);

SELECT lives_ok(
  format(
    'SELECT public.persist_article_workflow(%L, %L::jsonb, %L, NULL)',
    (SELECT id FROM workflow_test_articles WHERE name = 'primary'),
    '{}'::jsonb::TEXT,
    'unpublish'
  ),
  'published article can be explicitly unpublished'
);

SELECT ok(
  (SELECT workflow_status = 'draft'
    AND status = 'draft'
    AND approved_at IS NULL
    AND published_at IS NULL
   FROM public.blog_posts
   WHERE id = (SELECT id FROM workflow_test_articles WHERE name = 'primary')),
  'unpublish clears approval and publication timestamps'
);

RESET ROLE;
SET LOCAL ROLE anon;

SELECT is(
  (SELECT COUNT(*)
   FROM public.blog_posts
   WHERE slug LIKE 'test-workflow-%'),
  1::BIGINT,
  'public RLS returns only published workflow test articles'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

INSERT INTO public.affiliate_programs (id, name, network, status)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Approved test program', 'direct', 'approved'),
  ('10000000-0000-0000-0000-000000000002', 'Pending test program', 'direct', 'approved');

INSERT INTO public.affiliate_links (
  id,
  slug,
  label,
  program_id,
  destination_url,
  use_redirect,
  active
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'approved-test-link',
    'View approved test link',
    '10000000-0000-0000-0000-000000000001',
    'https://example.com/approved',
    true,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'pending-test-link',
    'View pending test link',
    '10000000-0000-0000-0000-000000000002',
    'https://example.com/pending',
    true,
    true
  );

UPDATE public.affiliate_programs
SET status = 'pending'
WHERE id = '10000000-0000-0000-0000-000000000002';

RESET ROLE;
SET LOCAL ROLE anon;

SELECT results_eq(
  $$
    SELECT slug
    FROM public.affiliate_links
    WHERE slug IN ('approved-test-link', 'pending-test-link')
    ORDER BY slug
  $$,
  $$ VALUES ('approved-test-link'::TEXT) $$,
  'public affiliate RLS hides links for unapproved programs'
);

SELECT * FROM finish();
ROLLBACK;
