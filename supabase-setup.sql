-- Devicefield affiliate blog CMS
-- Run this in the Supabase SQL Editor for the project used by your site.
-- After creating your admin auth user, set that user as admin with:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Buying Guides',
  tags TEXT[] NOT NULL DEFAULT '{}',
  affiliate_programs TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  cover_image_alt TEXT,
  focus_keyword TEXT,
  seo_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  faq_items JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(faq_items) = 'array'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at
  ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
  ON public.blog_posts(featured)
  WHERE featured = true;

DROP TRIGGER IF EXISTS set_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published blog posts are public" ON public.blog_posts;
CREATE POLICY "Published blog posts are public"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

DROP POLICY IF EXISTS "Admins can read all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can read all blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
CREATE POLICY "Admins can insert blog posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;
CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at
  ON public.newsletter_subscribers(created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    AND status = 'subscribed'
  );

DROP POLICY IF EXISTS "Admins can read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can read newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT ON public.newsletter_subscribers TO authenticated;

CREATE TABLE IF NOT EXISTS public.site_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TRIGGER IF EXISTS set_site_pages_updated_at ON public.site_pages;
CREATE TRIGGER set_site_pages_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site pages are public" ON public.site_pages;
CREATE POLICY "Site pages are public"
  ON public.site_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert site pages" ON public.site_pages;
CREATE POLICY "Admins can insert site pages"
  ON public.site_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update site pages" ON public.site_pages;
CREATE POLICY "Admins can update site pages"
  ON public.site_pages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_pages TO authenticated;

INSERT INTO public.site_pages (slug, title, meta_description, content)
VALUES
  (
    'home',
    'Devicefield - Tested devices and systems for modern businesses',
    'Independent buying guides, product reviews, comparisons, setup guides, and troubleshooting articles for business devices and systems.',
    jsonb_build_object(
      'eyebrow', 'Independent reviews. Business-first.',
      'heading', 'Tested devices and systems for modern businesses.',
      'intro', 'Independent buying guides, compatibility notes, reviews, setup guides, and troubleshooting articles for business devices and systems.',
      'primaryCta', 'Browse Buying Guides',
      'secondaryCta', 'How we test',
      'coverageLabel', 'Coverage map',
      'focusAreas', jsonb_build_array(
        'Business devices',
        'SaaS systems',
        'AI workflows',
        'Security tools',
        'Web infrastructure',
        'Operations stack'
      ),
      'featuredEyebrow', 'Featured',
      'featuredHeading', 'Practical buying guides',
      'affiliateEyebrow', 'Research library',
      'affiliateHeading', 'Built around buyer-intent research, not random link lists.',
      'latestEyebrow', 'Latest',
      'latestHeading', 'New from Devicefield',
      'disclosureEyebrow', 'Disclosure',
      'disclosureText', 'Some articles may include partner links. The goal is to publish useful, test-driven recommendations with clear tradeoffs.'
    )
  ),
  (
    'blog',
    'Business Device and Systems Guides - Devicefield',
    'Browse Devicefield buying guides, business system reviews, security checklists, and implementation playbooks.',
    jsonb_build_object(
      'eyebrow', 'Field notes',
      'heading', 'Reviews, comparisons, and operating guides.',
      'intro', 'Clear recommendations for teams choosing devices, SaaS platforms, AI workflows, security tools, and the systems that connect them.'
    )
  ),
  (
    'terms',
    'Terms, Affiliate Disclosure, and Editorial Policy - Devicefield',
    'Read Devicefield''s affiliate disclosure, editorial policy, and website terms.',
    jsonb_build_object(
      'eyebrow', 'Policy',
      'heading', 'Terms, disclosure, and editorial standards.',
      'intro', 'Devicefield is an independent publication focused on devices, software, and systems for modern businesses.',
      'sections', jsonb_build_array(
        jsonb_build_object(
          'title', 'Affiliate disclosure',
          'body', 'Devicefield may earn commissions when readers click affiliate links and purchase products or services. Those commissions help fund testing, writing, hosting, and maintenance. Affiliate compensation does not guarantee coverage, placement, or a positive recommendation.'
        ),
        jsonb_build_object(
          'title', 'Editorial policy',
          'body', 'Recommendations should be based on product fit, testing notes, implementation tradeoffs, pricing context, security considerations, and realistic alternatives. Devicefield aims to explain who a product is best for and who should avoid it.'
        ),
        jsonb_build_object(
          'title', 'No professional advice',
          'body', 'Devicefield content is for general informational purposes. It is not legal, financial, procurement, security, or technical consulting advice. Businesses should evaluate products against their own requirements before buying.'
        ),
        jsonb_build_object(
          'title', 'Accuracy and changes',
          'body', 'Pricing, product features, affiliate terms, and availability can change. Devicefield may update articles over time, but readers should verify important details with the vendor before making a purchase.'
        ),
        jsonb_build_object(
          'title', 'Website use',
          'body', 'By using this website, you agree not to misuse the site, attempt unauthorized access, copy content at scale, or interfere with normal operation. Devicefield may update these terms as the site evolves.'
        )
      )
    )
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  tags,
  affiliate_programs,
  status,
  featured,
  published_at
)
VALUES
  (
    'How we test business tools before recommending them',
    'how-we-test-business-tools',
    'The Devicefield review methodology for affiliate articles: hands-on testing, buyer-intent search coverage, and transparent tradeoffs.',
    '## Our review standard

Devicefield exists to help businesses choose devices and systems with less guesswork. Some links may be affiliate links, but a commission cannot buy a recommendation.

- What business problem does this solve?
- How long does setup realistically take?
- What does it cost after the introductory plan?
- Which teams should avoid it?
- What alternatives are stronger for different use cases?

## Why this matters for SEO

Search engines reward content that demonstrates experience and helps readers complete a task. For affiliate content, that means original observations, screenshots or implementation notes, comparison tables, FAQs, and clear next steps.',
    'Buying Guides',
    ARRAY['reviews', 'methodology', 'affiliate disclosure'],
    ARRAY['Semrush', 'SurferSEO', 'Frase'],
    'published',
    true,
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
