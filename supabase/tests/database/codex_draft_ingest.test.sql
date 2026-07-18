BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(9);

CREATE OR REPLACE FUNCTION pg_temp.codex_payload(p_title TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'title', p_title,
    'slug', 'test-codex-draft-ingest',
    'excerpt', 'A researched database ingestion test.',
    'content', '## Test draft\n\nDatabase ingestion coverage.',
    'category', 'Troubleshooting',
    'article_type', 'troubleshooting',
    'testing_status', 'researched',
    'tags', jsonb_build_array('database-test'),
    'faq_items', '[]'::jsonb,
    'sources', '[]'::jsonb,
    'claims', '[]'::jsonb,
    'quick_verdict', '{}'::jsonb,
    'original_evidence', '[]'::jsonb
  );
$$;

CREATE TEMP TABLE codex_ingest_results (
  name TEXT PRIMARY KEY,
  id UUID NOT NULL,
  created BOOLEAN NOT NULL
);

GRANT SELECT, INSERT ON codex_ingest_results TO service_role;

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.ingest_codex_draft(jsonb)',
    'EXECUTE'
  ),
  'service role can execute draft ingestion'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.ingest_codex_draft(jsonb)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute draft ingestion'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.ingest_codex_draft(jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot execute draft ingestion'
);

SET LOCAL ROLE service_role;

INSERT INTO codex_ingest_results (name, id, created)
SELECT 'created', article_id, was_created
FROM public.ingest_codex_draft(pg_temp.codex_payload('Initial Codex draft'));

SELECT ok(
  (
    SELECT workflow_status = 'draft'
      AND testing_status = 'researched'
      AND status = 'draft'
      AND featured = false
      AND published_at IS NULL
    FROM public.blog_posts
    WHERE id = (SELECT id FROM codex_ingest_results WHERE name = 'created')
  ),
  'ingestion creates an unpublished researched draft'
);

INSERT INTO codex_ingest_results (name, id, created)
SELECT 'updated', article_id, was_created
FROM public.ingest_codex_draft(pg_temp.codex_payload('Updated Codex draft'));

SELECT ok(
  (
    SELECT updated.id = created.id
      AND updated.created = false
      AND blog_posts.title = 'Updated Codex draft'
    FROM codex_ingest_results AS updated
    JOIN codex_ingest_results AS created ON created.name = 'created'
    JOIN public.blog_posts ON blog_posts.id = updated.id
    WHERE updated.name = 'updated'
  ),
  'ingestion updates the same draft by slug'
);

SELECT throws_ok(
  format(
    'SELECT * FROM public.ingest_codex_draft(%L::jsonb)',
    (pg_temp.codex_payload('Tested claim') || '{"testing_status":"tested"}'::jsonb)::TEXT
  ),
  'P0001',
  'Codex drafts must use researched testing status',
  'ingestion cannot mark a draft as tested'
);

SELECT throws_ok(
  format(
    'SELECT * FROM public.ingest_codex_draft(%L::jsonb)',
    (pg_temp.codex_payload('Workflow bypass') || '{"workflow_status":"published"}'::jsonb)::TEXT
  ),
  'P0001',
  'Draft ingestion cannot set editorial workflow fields',
  'ingestion cannot set workflow state'
);

UPDATE public.blog_posts
SET workflow_status = 'ready_for_review'
WHERE id = (SELECT id FROM codex_ingest_results WHERE name = 'created');

SELECT throws_ok(
  format(
    'SELECT * FROM public.ingest_codex_draft(%L::jsonb)',
    pg_temp.codex_payload('Unreviewed replacement')::TEXT
  ),
  'P0001',
  'Codex ingestion can update only draft articles',
  'ingestion cannot replace content after editorial review begins'
);

SELECT is(
  (
    SELECT title
    FROM public.blog_posts
    WHERE id = (SELECT id FROM codex_ingest_results WHERE name = 'created')
  ),
  'Updated Codex draft',
  'a rejected ingestion leaves reviewed content unchanged'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
