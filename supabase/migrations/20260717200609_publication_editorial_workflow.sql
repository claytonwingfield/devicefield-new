CREATE TABLE IF NOT EXISTS public.authors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  job_title TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TRIGGER IF EXISTS set_authors_updated_at ON public.authors;
CREATE TRIGGER set_authors_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Author profiles are public" ON public.authors;
CREATE POLICY "Author profiles are public"
  ON public.authors
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert authors" ON public.authors;
CREATE POLICY "Admins can insert authors"
  ON public.authors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update authors" ON public.authors;
CREATE POLICY "Admins can update authors"
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON public.authors TO anon, authenticated;
GRANT INSERT, UPDATE ON public.authors TO authenticated;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'buying_guide',
  ADD COLUMN IF NOT EXISTS testing_status TEXT,
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quick_verdict JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS compatibility_notes TEXT,
  ADD COLUMN IF NOT EXISTS limitations TEXT,
  ADD COLUMN IF NOT EXISTS testing_method TEXT,
  ADD COLUMN IF NOT EXISTS original_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_article_type_check,
  ADD CONSTRAINT blog_posts_article_type_check CHECK (
    article_type IN (
      'buying_guide',
      'review',
      'comparison',
      'setup_guide',
      'compatibility_guide',
      'troubleshooting'
    )
  ),
  DROP CONSTRAINT IF EXISTS blog_posts_testing_status_check,
  ADD CONSTRAINT blog_posts_testing_status_check CHECK (
    testing_status IS NULL OR testing_status IN ('tested', 'researched', 'mixed')
  ),
  DROP CONSTRAINT IF EXISTS blog_posts_workflow_status_check,
  ADD CONSTRAINT blog_posts_workflow_status_check CHECK (
    workflow_status IN (
      'draft',
      'ready_for_review',
      'approved',
      'scheduled',
      'published',
      'archived'
    )
  ),
  DROP CONSTRAINT IF EXISTS blog_posts_sources_array_check,
  ADD CONSTRAINT blog_posts_sources_array_check CHECK (jsonb_typeof(sources) = 'array'),
  DROP CONSTRAINT IF EXISTS blog_posts_claims_array_check,
  ADD CONSTRAINT blog_posts_claims_array_check CHECK (jsonb_typeof(claims) = 'array'),
  DROP CONSTRAINT IF EXISTS blog_posts_quick_verdict_object_check,
  ADD CONSTRAINT blog_posts_quick_verdict_object_check CHECK (jsonb_typeof(quick_verdict) = 'object'),
  DROP CONSTRAINT IF EXISTS blog_posts_original_evidence_array_check,
  ADD CONSTRAINT blog_posts_original_evidence_array_check CHECK (jsonb_typeof(original_evidence) = 'array');

UPDATE public.blog_posts
SET
  workflow_status = CASE status
    WHEN 'published' THEN 'published'
    WHEN 'archived' THEN 'archived'
    ELSE 'draft'
  END,
  approved_at = CASE
    WHEN status = 'published' THEN COALESCE(published_at, updated_at)
    ELSE approved_at
  END
WHERE workflow_status = 'draft';

CREATE INDEX IF NOT EXISTS idx_blog_posts_workflow_published_at
  ON public.blog_posts(workflow_status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_reviewer_id ON public.blog_posts(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_for
  ON public.blog_posts(scheduled_for)
  WHERE workflow_status = 'scheduled';

CREATE OR REPLACE FUNCTION public.enforce_blog_post_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.workflow_status <> 'draft' THEN
    RAISE EXCEPTION 'New articles must start as draft';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
    IF NEW.workflow_status = 'ready_for_review' AND OLD.workflow_status <> 'draft' THEN
      RAISE EXCEPTION 'Only draft articles can be marked ready for review';
    END IF;

    IF NEW.workflow_status = 'approved'
      AND OLD.workflow_status NOT IN ('ready_for_review', 'scheduled') THEN
      RAISE EXCEPTION 'Only ready-for-review articles can be approved';
    END IF;

    IF NEW.workflow_status = 'scheduled' THEN
      IF OLD.workflow_status <> 'approved' THEN
        RAISE EXCEPTION 'An article must be approved before it can be scheduled';
      END IF;
      IF NEW.scheduled_for IS NULL OR NEW.scheduled_for <= NOW() THEN
        RAISE EXCEPTION 'Scheduled publication requires a future timestamp';
      END IF;
    END IF;

    IF NEW.workflow_status = 'published' AND OLD.workflow_status <> 'approved' THEN
      RAISE EXCEPTION 'An article must be approved before it can be published';
    END IF;
  END IF;

  IF NEW.workflow_status = 'approved' THEN
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
    NEW.scheduled_for := NULL;
  ELSIF NEW.workflow_status = 'scheduled' THEN
    NEW.status := 'draft';
    NEW.published_at := NULL;
  ELSIF NEW.workflow_status = 'published' THEN
    NEW.status := 'published';
    NEW.published_at := COALESCE(NEW.published_at, NOW());
    NEW.scheduled_for := NULL;
  ELSIF NEW.workflow_status = 'archived' THEN
    NEW.status := 'archived';
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  ELSE
    NEW.status := 'draft';
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_blog_post_workflow ON public.blog_posts;
CREATE TRIGGER enforce_blog_post_workflow
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_blog_post_workflow();

REVOKE EXECUTE ON FUNCTION public.enforce_blog_post_workflow() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Published blog posts are public" ON public.blog_posts;
CREATE POLICY "Published blog posts are public"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    workflow_status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

DROP POLICY IF EXISTS "Published article products are public" ON public.article_products;
CREATE POLICY "Published article products are public"
  ON public.article_products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = article_products.article_id
        AND blog_posts.workflow_status = 'published'
        AND blog_posts.published_at IS NOT NULL
        AND blog_posts.published_at <= NOW()
    )
    AND EXISTS (
      SELECT 1 FROM public.affiliate_links
      WHERE affiliate_links.id = article_products.affiliate_link_id
        AND affiliate_links.active = true
    )
  );

CREATE OR REPLACE FUNCTION public.transition_article_workflow(
  p_article_id UUID,
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
  v_next_status TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  v_next_status := CASE p_action
    WHEN 'save_draft' THEN 'draft'
    WHEN 'mark_ready' THEN 'ready_for_review'
    WHEN 'approve' THEN 'approved'
    WHEN 'schedule' THEN 'scheduled'
    WHEN 'publish' THEN 'published'
    WHEN 'archive' THEN 'archived'
    ELSE NULL
  END;

  IF v_next_status IS NULL THEN
    RAISE EXCEPTION 'Unsupported workflow action';
  END IF;

  UPDATE public.blog_posts
  SET
    workflow_status = v_next_status,
    scheduled_for = CASE WHEN v_next_status = 'scheduled' THEN p_scheduled_for ELSE scheduled_for END,
    reviewed_at = CASE WHEN v_next_status = 'approved' THEN NOW() ELSE reviewed_at END,
    last_reviewed_at = CASE WHEN v_next_status = 'approved' THEN NOW() ELSE last_reviewed_at END
  WHERE id = p_article_id
  RETURNING * INTO v_article;

  IF v_article.id IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;

  RETURN v_article;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_article_workflow(UUID, TEXT, TIMESTAMP WITH TIME ZONE)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_article_workflow(UUID, TEXT, TIMESTAMP WITH TIME ZONE)
  TO authenticated;

-- Remove the old public demo/methodology article. Methodology now has a trust page.
DELETE FROM public.blog_posts
WHERE slug = 'how-we-test-business-tools';

-- The legacy string array is no longer used for article recommendations.
UPDATE public.blog_posts
SET affiliate_programs = '{}'
WHERE CARDINALITY(affiliate_programs) > 0;

INSERT INTO public.affiliate_programs (name, network, status, notes)
SELECT candidate.name, candidate.network, 'not_applied',
  'Devicefield-relevant candidate. Verify current program terms before applying.'
FROM (
  VALUES
    ('Amazon Associates', 'amazon'),
    ('B&H Photo Affiliate Program', 'other'),
    ('Newegg Affiliate Program', 'other'),
    ('Staples Affiliate Program', 'other'),
    ('Best Buy Affiliate Program', 'other')
) AS candidate(name, network)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.affiliate_programs existing
  WHERE LOWER(existing.name) = LOWER(candidate.name)
);

INSERT INTO public.site_pages (slug, title, meta_description, content)
VALUES
  (
    'global',
    'Devicefield publication settings',
    'Shared Devicefield navigation and footer content.',
    '{
      "newsletterLabel": "Newsletter",
      "navItems": [
        {"href": "/blog", "label": "Guides"},
        {"href": "/blog?type=reviews", "label": "Reviews"},
        {"href": "/blog?type=comparisons", "label": "Comparisons"},
        {"href": "/category/troubleshooting", "label": "Troubleshooting"},
        {"href": "/about", "label": "About"}
      ],
      "footerPublicationLinks": [
        {"href": "/blog", "label": "All guides"},
        {"href": "/about", "label": "About"},
        {"href": "/contact", "label": "Contact"},
        {"href": "/review-methodology", "label": "Review methodology"},
        {"href": "/editorial-policy", "label": "Editorial policy"}
      ],
      "footerPolicyLinks": [
        {"href": "/affiliate-disclosure", "label": "Affiliate disclosure"},
        {"href": "/privacy", "label": "Privacy Policy"},
        {"href": "/terms", "label": "Terms of Use"}
      ],
      "footerDescription": "Devicefield publishes independent buying guides, reviews, compatibility notes, and troubleshooting help for business devices and systems.",
      "footerDisclosure": "Devicefield may earn commissions from qualifying purchases made through clearly identified partner links.",
      "footerTagline": "Tested devices and systems for modern businesses.",
      "footerNewsletterHeading": "Newsletter",
      "footerNewsletterText": "Get new buying guides, corrections, and practical business technology notes when they publish."
    }'::jsonb
  ),
  (
    'about',
    'About Devicefield - Independent Business Technology Publication',
    'Learn how Devicefield researches business devices and systems, labels hands-on testing, and maintains independent editorial standards.',
    '{
      "eyebrow": "About Devicefield",
      "heading": "Practical technology guidance for modern businesses.",
      "intro": "Devicefield helps business owners and operators choose, connect, and troubleshoot the devices and systems their teams rely on.",
      "missionHeading": "Useful answers before expensive decisions.",
      "missionBody": "Coverage focuses on barcode and inventory systems, receipt and label printing, POS hardware, networking and uptime, business software, and the problems that appear when those systems need to work together.",
      "standardsHeading": "Clear testing labels",
      "standardsBody": "Hands-on testing is identified only when an article includes real testing notes, screenshots, photos, measurements, or other direct evidence. Otherwise, coverage is labeled researched or mixed.",
      "independenceHeading": "Independent and reader-supported",
      "independenceBody": "Partner relationships do not guarantee coverage, placement, or a positive recommendation. Useful guides explain fit, tradeoffs, limitations, and alternatives."
    }'::jsonb
  ),
  (
    'contact',
    'Contact Devicefield',
    'Contact Devicefield with corrections, questions, product information, or editorial feedback.',
    '{
      "eyebrow": "Contact",
      "heading": "Questions, corrections, and useful product context.",
      "intro": "Devicefield welcomes factual corrections, reader questions, and relevant information that can improve published guidance.",
      "sections": [
        {"title": "Editorial and corrections", "body": "Email contact@devicefield.com with the article URL, the detail that needs review, and a source when available."},
        {"title": "Products and review access", "body": "Vendors may share documentation or offer review access, but access does not guarantee coverage or a positive recommendation."},
        {"title": "Response expectations", "body": "Messages are reviewed manually. Devicefield prioritizes corrections and questions tied to published business-device guidance."}
      ]
    }'::jsonb
  ),
  (
    'review-methodology',
    'Review Methodology - Devicefield',
    'Learn how Devicefield evaluates compatibility, setup, reliability, value, and evidence for business technology coverage.',
    '{
      "eyebrow": "Review methodology",
      "heading": "How Devicefield evaluates business technology.",
      "intro": "The process changes with the product, but the evidence label and the core evaluation questions remain consistent.",
      "sections": [
        {"title": "Testing status", "body": "Tested means hands-on evidence is documented. Researched means the article relies on specifications, documentation, demonstrations, and credible sources. Mixed means only part of the recommendation set was tested directly."},
        {"title": "Compatibility", "body": "We check required operating systems, ports, drivers, accessories, integrations, media, subscriptions, and other dependencies that affect deployment."},
        {"title": "Setup and reliability", "body": "When hands-on access is available, notes focus on setup time, reconnect behavior, normal operation, failure handling, and recovery. Research-only coverage clearly says what could not be verified directly."},
        {"title": "Value and limitations", "body": "Evaluation includes required accessories, ongoing subscriptions, replacement supplies, switching costs, support constraints, known limitations, and credible alternatives."},
        {"title": "Updates and corrections", "body": "Commercial and compatibility details can change. Articles include review dates where available, and material corrections are welcomed through the contact page."}
      ]
    }'::jsonb
  ),
  (
    'editorial-policy',
    'Editorial Policy - Devicefield',
    'Read Devicefield editorial standards for sourcing, testing labels, corrections, independence, and affiliate relationships.',
    '{
      "eyebrow": "Editorial policy",
      "heading": "Evidence first, labels that match the work.",
      "intro": "Devicefield separates what was observed directly from what was verified through documentation and other sources.",
      "sections": [
        {"title": "No fabricated testing", "body": "A product is described as tested only when the article includes genuine hands-on notes, screenshots, photos, measurements, or other original evidence."},
        {"title": "Sources and claims", "body": "Important factual, numerical, compatibility, pricing, and commercial claims should be tied to current sources. Unresolved high-risk claims should not be published."},
        {"title": "Recommendations", "body": "Best-for recommendations should explain selection criteria, who the product fits, who should avoid it, known limitations, and reasonable alternatives."},
        {"title": "Commercial independence", "body": "Affiliate eligibility, commissions, vendor access, and advertising do not guarantee coverage or determine a positive conclusion."},
        {"title": "Corrections", "body": "Material errors should be corrected promptly. Readers and vendors can submit a correction with supporting evidence through the contact page."}
      ]
    }'::jsonb
  ),
  (
    'affiliate-disclosure',
    'Affiliate Disclosure - Devicefield',
    'Learn how affiliate links support Devicefield and how commercial relationships are disclosed.',
    '{
      "eyebrow": "Affiliate disclosure",
      "heading": "How partner links support Devicefield.",
      "intro": "Some articles contain clearly identified partner links. Devicefield may earn a commission when a reader makes a qualifying purchase through one of those links.",
      "sections": [
        {"title": "No added reader cost", "body": "A qualifying purchase may generate a commission without changing the price paid by the reader, although prices and terms are controlled by the seller."},
        {"title": "Disclosure in articles", "body": "Articles with affiliate-linked recommendations display a disclosure near the article introduction. Affiliate buttons are labeled and use sponsored link attributes."},
        {"title": "Editorial separation", "body": "Compensation does not guarantee coverage, placement, an award, or a positive recommendation. Tradeoffs and alternatives remain part of the editorial decision."},
        {"title": "Verify before buying", "body": "Pricing, availability, compatibility, and program terms can change. Readers should confirm important details with the seller before purchasing."}
      ]
    }'::jsonb
  ),
  (
    'privacy',
    'Privacy Policy - Devicefield',
    'Learn how Devicefield collects, uses, and protects newsletter, analytics, affiliate, and website data.',
    '{
      "eyebrow": "Policy",
      "heading": "Privacy Policy",
      "intro": "This policy explains what Devicefield collects, why it is used, and the choices available to readers.",
      "sections": [
        {"title": "Newsletter data", "body": "When you subscribe, Devicefield stores your email address, consent and confirmation timestamps, subscription status, and the page where you subscribed. Confirmation is required before marketing emails are sent."},
        {"title": "Email providers", "body": "Confirmed subscriber information may be synchronized with an email delivery provider to send requested messages, process delivery events, and honor unsubscribe requests."},
        {"title": "Security and abuse prevention", "body": "Devicefield uses short-lived rate-limit records, hashed request identifiers, and anti-bot fields to reduce abuse. Raw IP addresses are not stored in the newsletter subscriber record."},
        {"title": "Affiliate and website data", "body": "Devicefield may record limited click, referral, country, and browser information for affiliate-link security and aggregate content performance. Tracking failures do not prevent a redirect."},
        {"title": "Your choices", "body": "You can unsubscribe at any time using the link in Devicefield emails. To ask about, correct, or delete your information, contact contact@devicefield.com."}
      ]
    }'::jsonb
  ),
  (
    'terms',
    'Terms of Use - Devicefield',
    'Read the terms that apply when using Devicefield business technology articles and website features.',
    '{
      "eyebrow": "Policy",
      "heading": "Terms of Use",
      "intro": "These terms apply to use of Devicefield.com and its informational content.",
      "sections": [
        {"title": "Informational content", "body": "Devicefield content is general information, not legal, financial, security, procurement, or individualized technical advice. Evaluate products against your own requirements."},
        {"title": "Changing product information", "body": "Pricing, availability, features, compatibility, and support terms can change. Verify material details with the manufacturer, vendor, or service provider before purchasing or deploying a product."},
        {"title": "Website use", "body": "Do not misuse the website, attempt unauthorized access, interfere with operation, submit abusive automated requests, or reproduce substantial content without permission."},
        {"title": "Third-party services", "body": "Devicefield links to third-party websites that control their own products, terms, availability, privacy practices, and transactions."},
        {"title": "Updates", "body": "These terms may be updated as the publication and its services change. Continued use of the site is subject to the current published version."}
      ]
    }'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  updated_at = TIMEZONE('utc'::text, NOW());

UPDATE public.site_pages
SET
  title = 'Devicefield - Tested devices and systems for modern businesses',
  meta_description = 'Independent buying guides, product reviews, comparisons, setup guides, and troubleshooting articles for business devices and systems.',
  content = (
    content
    - 'affiliateEyebrow'
    - 'affiliateHeading'
    - 'coverageLabel'
    - 'focusAreas'
    - 'disclosureEyebrow'
    - 'disclosureText'
  ) || '{
    "eyebrow": "Independent reviews. Business-first.",
    "heading": "Tested devices and systems for modern businesses.",
    "intro": "Independent buying guides, compatibility notes, reviews, setup guides, and troubleshooting articles for business devices and systems.",
    "primaryCta": "Browse Buying Guides",
    "secondaryCta": "How we evaluate",
    "heroEvaluationLabel": "How we evaluate",
    "heroSteps": ["Research", "Verify", "Explain"],
    "categoryEyebrow": "Coverage",
    "categoryHeading": "Business technology categories Devicefield covers.",
    "categoryIntro": "Focused guides for the hardware, software, and reliability problems businesses run into every day.",
    "featuredEyebrow": "Featured",
    "featuredHeading": "Practical buying guides",
    "latestEyebrow": "Latest",
    "latestHeading": "New from Devicefield",
    "evaluationEyebrow": "Evaluation system",
    "evaluationHeading": "Evidence for the decisions that affect daily operations.",
    "evaluationIntro": "Guides consider deployment effort, total cost, compatibility, reliability, and the practical limits a business needs to know before buying.",
    "newsletterEyebrow": "Free checklist",
    "newsletterHeading": "Get the Business Technology Checklist",
    "newsletterIntro": "A practical checklist for selecting POS hardware, scanners, printers, networking equipment, and backup power."
  }'::jsonb,
  updated_at = TIMEZONE('utc'::text, NOW())
WHERE slug = 'home';
