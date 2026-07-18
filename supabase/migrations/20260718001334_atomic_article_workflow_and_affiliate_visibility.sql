CREATE OR REPLACE FUNCTION public.enforce_blog_post_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_action TEXT := COALESCE(current_setting('app.workflow_action', true), '');
  v_old_content JSONB;
  v_new_content JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.workflow_status <> 'draft' THEN
      RAISE EXCEPTION 'New articles must start as draft';
    END IF;
  ELSE
    IF OLD.workflow_status = 'archived'
      AND NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
      RAISE EXCEPTION 'Archived articles cannot transition to another status';
    END IF;

    IF OLD.workflow_status = 'published' THEN
      v_old_content := to_jsonb(OLD) - ARRAY[
        'workflow_status', 'status', 'approved_at', 'scheduled_for',
        'published_at', 'updated_at'
      ];
      v_new_content := to_jsonb(NEW) - ARRAY[
        'workflow_status', 'status', 'approved_at', 'scheduled_for',
        'published_at', 'updated_at'
      ];

      IF v_new_content IS DISTINCT FROM v_old_content THEN
        RAISE EXCEPTION 'Published articles must be unpublished before content editing';
      END IF;

      IF NEW.workflow_status = 'draft' AND v_action <> 'unpublish' THEN
        RAISE EXCEPTION 'Published articles can return to draft only through unpublish';
      END IF;
    END IF;

    IF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
      IF NEW.workflow_status = 'ready_for_review'
        AND OLD.workflow_status <> 'draft' THEN
        RAISE EXCEPTION 'Only draft articles can be marked ready for review';
      ELSIF NEW.workflow_status = 'draft'
        AND OLD.workflow_status NOT IN ('ready_for_review', 'published') THEN
        RAISE EXCEPTION 'Only ready-for-review or explicitly unpublished articles can return to draft';
      ELSIF NEW.workflow_status = 'approved'
        AND OLD.workflow_status NOT IN ('ready_for_review', 'scheduled') THEN
        RAISE EXCEPTION 'Only ready-for-review or scheduled articles can become approved';
      ELSIF NEW.workflow_status = 'scheduled'
        AND OLD.workflow_status <> 'approved' THEN
        RAISE EXCEPTION 'An article must be approved before it can be scheduled';
      ELSIF NEW.workflow_status = 'published'
        AND OLD.workflow_status NOT IN ('approved', 'scheduled') THEN
        RAISE EXCEPTION 'An article must be approved or scheduled before it can be published';
      ELSIF NEW.workflow_status = 'archived'
        AND OLD.workflow_status = 'archived' THEN
        RAISE EXCEPTION 'Article is already archived';
      END IF;
    END IF;
  END IF;

  IF NEW.workflow_status = 'draft' THEN
    NEW.status := 'draft';
    NEW.approved_at := NULL;
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  ELSIF NEW.workflow_status = 'ready_for_review' THEN
    NEW.status := 'draft';
    NEW.approved_at := NULL;
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  ELSIF NEW.workflow_status = 'approved' THEN
    IF TG_OP = 'INSERT' OR OLD.workflow_status IS DISTINCT FROM 'approved' THEN
      NEW.approved_at := NOW();
      NEW.reviewed_at := NOW();
      NEW.last_reviewed_at := NOW();
    END IF;
    NEW.status := 'draft';
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  ELSIF NEW.workflow_status = 'scheduled' THEN
    IF NEW.scheduled_for IS NULL OR NEW.scheduled_for <= NOW() THEN
      RAISE EXCEPTION 'Scheduled publication requires a future timestamp';
    END IF;
    NEW.status := 'draft';
    NEW.published_at := NULL;
  ELSIF NEW.workflow_status = 'published' THEN
    NEW.status := 'published';
    IF TG_OP = 'INSERT' OR OLD.workflow_status IS DISTINCT FROM 'published' THEN
      NEW.published_at := NOW();
    ELSE
      NEW.published_at := OLD.published_at;
    END IF;
    NEW.scheduled_for := NULL;
  ELSIF NEW.workflow_status = 'archived' THEN
    NEW.status := 'archived';
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.transition_article_workflow(UUID, TEXT, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION public.persist_article_workflow(
  p_article_id UUID,
  p_article JSONB,
  p_action TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS public.blog_posts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_article public.blog_posts;
  v_current public.blog_posts;
  v_next_status TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  v_next_status := CASE p_action
    WHEN 'save_draft' THEN 'draft'
    WHEN 'mark_ready' THEN 'ready_for_review'
    WHEN 'return_to_draft' THEN 'draft'
    WHEN 'approve' THEN 'approved'
    WHEN 'schedule' THEN 'scheduled'
    WHEN 'unschedule' THEN 'approved'
    WHEN 'publish' THEN 'published'
    WHEN 'unpublish' THEN 'draft'
    WHEN 'archive' THEN 'archived'
    ELSE NULL
  END;

  IF v_next_status IS NULL THEN
    RAISE EXCEPTION 'Unsupported workflow action';
  END IF;

  IF p_article_id IS NULL THEN
    IF p_action <> 'save_draft' THEN
      RAISE EXCEPTION 'New articles must be saved as draft before workflow transitions';
    END IF;
  ELSE
    SELECT *
    INTO v_current
    FROM public.blog_posts
    WHERE id = p_article_id
    FOR UPDATE;

    IF v_current.id IS NULL THEN
      RAISE EXCEPTION 'Article not found';
    END IF;

    IF p_action = 'save_draft' AND v_current.workflow_status <> 'draft' THEN
      RAISE EXCEPTION 'Only draft articles can be saved as draft';
    ELSIF p_action = 'mark_ready' AND v_current.workflow_status <> 'draft' THEN
      RAISE EXCEPTION 'Only draft articles can be marked ready for review';
    ELSIF p_action = 'return_to_draft' AND v_current.workflow_status <> 'ready_for_review' THEN
      RAISE EXCEPTION 'Only ready-for-review articles can return to draft';
    ELSIF p_action = 'approve' AND v_current.workflow_status <> 'ready_for_review' THEN
      RAISE EXCEPTION 'Only ready-for-review articles can be approved';
    ELSIF p_action = 'schedule' AND v_current.workflow_status <> 'approved' THEN
      RAISE EXCEPTION 'Only approved articles can be scheduled';
    ELSIF p_action = 'unschedule' AND v_current.workflow_status <> 'scheduled' THEN
      RAISE EXCEPTION 'Only scheduled articles can return to approved';
    ELSIF p_action = 'publish' AND v_current.workflow_status NOT IN ('approved', 'scheduled') THEN
      RAISE EXCEPTION 'Only approved or scheduled articles can be published';
    ELSIF p_action = 'unpublish' AND v_current.workflow_status <> 'published' THEN
      RAISE EXCEPTION 'Only published articles can be unpublished';
    ELSIF p_action = 'archive' AND v_current.workflow_status = 'archived' THEN
      RAISE EXCEPTION 'Article is already archived';
    END IF;
  END IF;

  PERFORM set_config('app.workflow_action', p_action, true);

  IF p_article_id IS NOT NULL
    AND v_current.workflow_status = 'published'
    AND p_action IN ('unpublish', 'archive') THEN
    UPDATE public.blog_posts
    SET workflow_status = v_next_status
    WHERE id = p_article_id
    RETURNING * INTO v_article;

    RETURN v_article;
  END IF;

  IF p_article IS NULL OR jsonb_typeof(p_article) <> 'object' THEN
    RAISE EXCEPTION 'Article fields must be a JSON object';
  END IF;

  IF NULLIF(TRIM(p_article->>'title'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'slug'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'excerpt'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'content'), '') IS NULL
    OR NULLIF(TRIM(p_article->>'category'), '') IS NULL THEN
    RAISE EXCEPTION 'Title, slug, excerpt, content, and category are required';
  END IF;

  IF jsonb_typeof(COALESCE(p_article->'tags', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'faq_items', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'sources', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'claims', '[]'::jsonb)) <> 'array'
    OR jsonb_typeof(COALESCE(p_article->'quick_verdict', '{}'::jsonb)) <> 'object'
    OR jsonb_typeof(COALESCE(p_article->'original_evidence', '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Article list and object fields are invalid';
  END IF;

  IF p_article_id IS NULL THEN
    INSERT INTO public.blog_posts (
      title, slug, excerpt, content, category, tags, cover_image_url,
      cover_image_alt, focus_keyword, seo_title, meta_description,
      canonical_url, faq_items, article_type, testing_status, workflow_status,
      author_id, reviewer_id, reviewed_at, last_verified_at, next_review_at,
      sources, claims, quick_verdict, compatibility_notes, limitations,
      testing_method, original_evidence, last_reviewed_at, internal_notes,
      featured, created_by
    )
    VALUES (
      TRIM(p_article->>'title'),
      TRIM(p_article->>'slug'),
      TRIM(p_article->>'excerpt'),
      TRIM(p_article->>'content'),
      TRIM(p_article->>'category'),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_article->'tags', '[]'::jsonb))),
      NULLIF(TRIM(p_article->>'cover_image_url'), ''),
      NULLIF(TRIM(p_article->>'cover_image_alt'), ''),
      NULLIF(TRIM(p_article->>'focus_keyword'), ''),
      NULLIF(TRIM(p_article->>'seo_title'), ''),
      NULLIF(TRIM(p_article->>'meta_description'), ''),
      NULLIF(TRIM(p_article->>'canonical_url'), ''),
      COALESCE(p_article->'faq_items', '[]'::jsonb),
      COALESCE(NULLIF(p_article->>'article_type', ''), 'buying_guide'),
      NULLIF(p_article->>'testing_status', ''),
      'draft',
      NULLIF(p_article->>'author_id', '')::UUID,
      NULLIF(p_article->>'reviewer_id', '')::UUID,
      NULLIF(p_article->>'reviewed_at', '')::TIMESTAMP WITH TIME ZONE,
      NULLIF(p_article->>'last_verified_at', '')::TIMESTAMP WITH TIME ZONE,
      NULLIF(p_article->>'next_review_at', '')::TIMESTAMP WITH TIME ZONE,
      COALESCE(p_article->'sources', '[]'::jsonb),
      COALESCE(p_article->'claims', '[]'::jsonb),
      COALESCE(p_article->'quick_verdict', '{}'::jsonb),
      NULLIF(TRIM(p_article->>'compatibility_notes'), ''),
      NULLIF(TRIM(p_article->>'limitations'), ''),
      NULLIF(TRIM(p_article->>'testing_method'), ''),
      COALESCE(p_article->'original_evidence', '[]'::jsonb),
      NULLIF(p_article->>'last_reviewed_at', '')::TIMESTAMP WITH TIME ZONE,
      NULLIF(TRIM(p_article->>'internal_notes'), ''),
      COALESCE((p_article->>'featured')::BOOLEAN, false),
      (SELECT auth.uid())
    )
    RETURNING * INTO v_article;
  ELSE
    UPDATE public.blog_posts
    SET
      title = TRIM(p_article->>'title'),
      slug = TRIM(p_article->>'slug'),
      excerpt = TRIM(p_article->>'excerpt'),
      content = TRIM(p_article->>'content'),
      category = TRIM(p_article->>'category'),
      tags = ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_article->'tags', '[]'::jsonb))),
      cover_image_url = NULLIF(TRIM(p_article->>'cover_image_url'), ''),
      cover_image_alt = NULLIF(TRIM(p_article->>'cover_image_alt'), ''),
      focus_keyword = NULLIF(TRIM(p_article->>'focus_keyword'), ''),
      seo_title = NULLIF(TRIM(p_article->>'seo_title'), ''),
      meta_description = NULLIF(TRIM(p_article->>'meta_description'), ''),
      canonical_url = NULLIF(TRIM(p_article->>'canonical_url'), ''),
      faq_items = COALESCE(p_article->'faq_items', '[]'::jsonb),
      article_type = COALESCE(NULLIF(p_article->>'article_type', ''), 'buying_guide'),
      testing_status = NULLIF(p_article->>'testing_status', ''),
      workflow_status = v_next_status,
      author_id = NULLIF(p_article->>'author_id', '')::UUID,
      reviewer_id = NULLIF(p_article->>'reviewer_id', '')::UUID,
      reviewed_at = NULLIF(p_article->>'reviewed_at', '')::TIMESTAMP WITH TIME ZONE,
      last_verified_at = NULLIF(p_article->>'last_verified_at', '')::TIMESTAMP WITH TIME ZONE,
      next_review_at = NULLIF(p_article->>'next_review_at', '')::TIMESTAMP WITH TIME ZONE,
      sources = COALESCE(p_article->'sources', '[]'::jsonb),
      claims = COALESCE(p_article->'claims', '[]'::jsonb),
      quick_verdict = COALESCE(p_article->'quick_verdict', '{}'::jsonb),
      compatibility_notes = NULLIF(TRIM(p_article->>'compatibility_notes'), ''),
      limitations = NULLIF(TRIM(p_article->>'limitations'), ''),
      testing_method = NULLIF(TRIM(p_article->>'testing_method'), ''),
      original_evidence = COALESCE(p_article->'original_evidence', '[]'::jsonb),
      last_reviewed_at = NULLIF(p_article->>'last_reviewed_at', '')::TIMESTAMP WITH TIME ZONE,
      internal_notes = NULLIF(TRIM(p_article->>'internal_notes'), ''),
      featured = COALESCE((p_article->>'featured')::BOOLEAN, false),
      scheduled_for = CASE WHEN p_action = 'schedule' THEN p_scheduled_for ELSE scheduled_for END
    WHERE id = p_article_id
    RETURNING * INTO v_article;
  END IF;

  RETURN v_article;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_article_workflow(UUID, JSONB, TEXT, TIMESTAMP WITH TIME ZONE)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.persist_article_workflow(UUID, JSONB, TEXT, TIMESTAMP WITH TIME ZONE)
  TO authenticated;

DROP POLICY IF EXISTS "Active affiliate links are public" ON public.affiliate_links;
DROP POLICY IF EXISTS "Approved active affiliate links are public" ON public.affiliate_links;
CREATE POLICY "Approved active affiliate links are public"
  ON public.affiliate_links
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1
      FROM public.affiliate_programs
      WHERE affiliate_programs.id = affiliate_links.program_id
        AND affiliate_programs.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Published article products are public" ON public.article_products;
CREATE POLICY "Published article products are public"
  ON public.article_products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.blog_posts
      WHERE blog_posts.id = article_products.article_id
        AND blog_posts.workflow_status = 'published'
        AND blog_posts.published_at IS NOT NULL
        AND blog_posts.published_at <= NOW()
    )
    AND EXISTS (
      SELECT 1
      FROM public.affiliate_links
      JOIN public.affiliate_programs
        ON affiliate_programs.id = affiliate_links.program_id
      WHERE affiliate_links.id = article_products.affiliate_link_id
        AND affiliate_links.active = true
        AND affiliate_programs.status = 'approved'
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_approved_affiliate_link_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.active = true
    AND (
      TG_OP = 'INSERT'
      OR OLD.active = false
      OR NEW.program_id IS DISTINCT FROM OLD.program_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.affiliate_programs
      WHERE affiliate_programs.id = NEW.program_id
        AND affiliate_programs.status = 'approved'
    ) THEN
    RAISE EXCEPTION 'Affiliate links can be activated only for approved programs';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_approved_affiliate_link_activation ON public.affiliate_links;
CREATE TRIGGER enforce_approved_affiliate_link_activation
  BEFORE INSERT OR UPDATE OF active, program_id ON public.affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_approved_affiliate_link_activation();

REVOKE EXECUTE ON FUNCTION public.enforce_approved_affiliate_link_activation()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_unpublished_article_product_edits()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_article_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_article_id := OLD.article_id;
  ELSE
    v_article_id := NEW.article_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.blog_posts
    WHERE blog_posts.id = v_article_id
      AND blog_posts.workflow_status = 'published'
  ) THEN
    RAISE EXCEPTION 'Published articles must be unpublished before product recommendations are changed';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_unpublished_article_product_edits ON public.article_products;
CREATE TRIGGER enforce_unpublished_article_product_edits
  BEFORE INSERT OR UPDATE OR DELETE ON public.article_products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_unpublished_article_product_edits();

REVOKE EXECUTE ON FUNCTION public.enforce_unpublished_article_product_edits()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_affiliate_click(
  p_affiliate_link_id UUID,
  p_article_id UUID DEFAULT NULL,
  p_cta_placement TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_visitor_hash TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_article_id UUID := NULL;
BEGIN
  IF p_visitor_hash IS NULL OR CHAR_LENGTH(p_visitor_hash) < 32 THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.affiliate_links
    JOIN public.affiliate_programs
      ON affiliate_programs.id = affiliate_links.program_id
    WHERE affiliate_links.id = p_affiliate_link_id
      AND affiliate_links.active = true
      AND affiliate_links.use_redirect = true
      AND affiliate_programs.status = 'approved'
  ) THEN
    RETURN false;
  END IF;

  IF p_article_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.blog_posts
    WHERE id = p_article_id
      AND workflow_status = 'published'
      AND published_at IS NOT NULL
      AND published_at <= NOW()
  ) THEN
    v_article_id := p_article_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_affiliate_link_id::TEXT || ':' || p_visitor_hash, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.affiliate_click_events
    WHERE affiliate_link_id = p_affiliate_link_id
      AND user_agent_hash = LEFT(p_visitor_hash, 64)
      AND created_at >= NOW() - INTERVAL '60 seconds'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.affiliate_click_events (
    affiliate_link_id,
    article_id,
    cta_placement,
    referrer,
    user_agent_hash,
    country
  )
  VALUES (
    p_affiliate_link_id,
    v_article_id,
    NULLIF(LEFT(TRIM(p_cta_placement), 80), ''),
    NULLIF(LEFT(TRIM(p_referrer), 500), ''),
    LEFT(p_visitor_hash, 64),
    NULLIF(LEFT(UPPER(TRIM(p_country)), 2), '')
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_affiliate_click(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_click(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
