DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
REVOKE INSERT ON public.newsletter_subscribers FROM anon, authenticated;

ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_subscribers_status_check;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_subscribers_status_check
  CHECK (status IN ('pending', 'subscribed', 'unsubscribed'));

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS unsubscribe_token_version INTEGER NOT NULL DEFAULT 1
    CHECK (unsubscribe_token_version > 0),
  ADD COLUMN IF NOT EXISTS provider_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_synced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

UPDATE public.newsletter_subscribers
SET
  consent_at = COALESCE(consent_at, created_at),
  confirmed_at = COALESCE(confirmed_at, created_at)
WHERE status = 'subscribed';

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_confirmation_token_hash
  ON public.newsletter_subscribers(confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status_created
  ON public.newsletter_subscribers(status, created_at DESC);

DROP TRIGGER IF EXISTS set_newsletter_subscribers_updated_at
  ON public.newsletter_subscribers;
CREATE TRIGGER set_newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.newsletter_subscription_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visitor_hash TEXT NOT NULL CHECK (CHAR_LENGTH(visitor_hash) >= 32),
  email_hash TEXT NOT NULL CHECK (CHAR_LENGTH(email_hash) >= 32),
  created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_attempts_visitor_created
  ON public.newsletter_subscription_attempts(visitor_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_attempts_email_created
  ON public.newsletter_subscription_attempts(email_hash, created_at DESC);

ALTER TABLE public.newsletter_subscription_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_subscription_attempts FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.newsletter_subscription_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.request_newsletter_subscription(
  p_email TEXT,
  p_source TEXT,
  p_visitor_hash TEXT,
  p_email_hash TEXT,
  p_confirmation_token_hash TEXT
)
RETURNS TABLE(result TEXT, subscriber_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(p_email));
  v_subscriber_id UUID;
BEGIN
  IF v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    OR CHAR_LENGTH(v_email) > 320
    OR CHAR_LENGTH(p_visitor_hash) < 32
    OR CHAR_LENGTH(p_email_hash) < 32
    OR CHAR_LENGTH(p_confirmation_token_hash) < 32
  THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended(LEFT(p_visitor_hash, 64), 1));

  IF (
    SELECT COUNT(*)
    FROM public.newsletter_subscription_attempts
    WHERE visitor_hash = LEFT(p_visitor_hash, 64)
      AND created_at >= NOW() - INTERVAL '15 minutes'
  ) >= 5 OR (
    SELECT COUNT(*)
    FROM public.newsletter_subscription_attempts
    WHERE email_hash = LEFT(p_email_hash, 64)
      AND created_at >= NOW() - INTERVAL '15 minutes'
  ) >= 3 THEN
    RETURN QUERY SELECT 'rate_limited'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  INSERT INTO public.newsletter_subscription_attempts (visitor_hash, email_hash)
  VALUES (LEFT(p_visitor_hash, 64), LEFT(p_email_hash, 64));

  SELECT id
  INTO v_subscriber_id
  FROM public.newsletter_subscribers
  WHERE email = v_email
    AND status = 'subscribed';

  IF v_subscriber_id IS NOT NULL THEN
    RETURN QUERY SELECT 'already_subscribed'::TEXT, v_subscriber_id;
    RETURN;
  END IF;

  INSERT INTO public.newsletter_subscribers (
    email,
    source,
    status,
    consent_at,
    confirmation_token_hash,
    confirmation_sent_at,
    confirmed_at,
    unsubscribed_at,
    provider_synced_at
  )
  VALUES (
    v_email,
    NULLIF(LEFT(TRIM(p_source), 200), ''),
    'pending',
    NOW(),
    LEFT(p_confirmation_token_hash, 64),
    NOW(),
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (email) DO UPDATE
  SET
    source = EXCLUDED.source,
    status = 'pending',
    consent_at = NOW(),
    confirmation_token_hash = EXCLUDED.confirmation_token_hash,
    confirmation_sent_at = NOW(),
    confirmed_at = NULL,
    unsubscribed_at = NULL,
    unsubscribe_token_version = newsletter_subscribers.unsubscribe_token_version + 1,
    provider_synced_at = NULL
  RETURNING id INTO v_subscriber_id;

  RETURN QUERY SELECT 'pending'::TEXT, v_subscriber_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_newsletter_subscription(
  p_confirmation_token_hash TEXT
)
RETURNS TABLE(
  subscriber_id UUID,
  subscriber_email TEXT,
  token_version INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.newsletter_subscribers AS subscriber
  SET
    status = 'subscribed',
    confirmed_at = NOW(),
    confirmation_token_hash = NULL,
    provider_synced_at = NULL
  WHERE subscriber.confirmation_token_hash = LEFT(p_confirmation_token_hash, 64)
    AND subscriber.status = 'pending'
    AND subscriber.confirmation_sent_at >= NOW() - INTERVAL '7 days'
  RETURNING
    subscriber.id,
    subscriber.email,
    subscriber.unsubscribe_token_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(
  p_subscriber_id UUID,
  p_token_version INTEGER
)
RETURNS TABLE(subscriber_email TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.newsletter_subscribers AS subscriber
  SET
    status = 'unsubscribed',
    unsubscribed_at = NOW(),
    confirmation_token_hash = NULL,
    unsubscribe_token_version = subscriber.unsubscribe_token_version + 1,
    provider_synced_at = NULL
  WHERE subscriber.id = p_subscriber_id
    AND subscriber.unsubscribe_token_version = p_token_version
    AND subscriber.status IN ('pending', 'subscribed')
  RETURNING subscriber.email;
END;
$$;

REVOKE ALL ON FUNCTION public.request_newsletter_subscription(TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_newsletter_subscription(TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unsubscribe_newsletter(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscribers TO service_role;
GRANT EXECUTE ON FUNCTION public.request_newsletter_subscription(TEXT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(UUID, INTEGER)
  TO service_role;

INSERT INTO public.site_pages (slug, title, meta_description, content)
VALUES (
  'privacy',
  'Privacy Policy - Devicefield',
  'Learn how Devicefield collects, uses, and protects newsletter, analytics, and website data.',
  jsonb_build_object(
    'eyebrow', 'Policy',
    'heading', 'Privacy Policy',
    'intro', 'This policy explains what Devicefield collects and how that information is used.',
    'sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Newsletter data',
        'body', 'When you subscribe, Devicefield stores your email address, consent and confirmation timestamps, subscription status, and the page where you subscribed. A confirmation email is required before marketing emails are sent.'
      ),
      jsonb_build_object(
        'title', 'Email providers',
        'body', 'Confirmed subscriber information may be synchronized with an email delivery provider to send requested messages, process delivery events, and honor unsubscribe requests.'
      ),
      jsonb_build_object(
        'title', 'Security and abuse prevention',
        'body', 'Devicefield uses short-lived rate-limit records, hashed request identifiers, and anti-bot fields to reduce abuse. Raw IP addresses are not stored in the newsletter subscription table.'
      ),
      jsonb_build_object(
        'title', 'Affiliate and website data',
        'body', 'Devicefield may record limited click and referral information for affiliate links and site performance. This information is used to understand content performance and maintain the website.'
      ),
      jsonb_build_object(
        'title', 'Your choices',
        'body', 'You can unsubscribe at any time using the link in Devicefield emails. To ask about, correct, or delete your information, contact contact@devicefield.com.'
      )
    )
  )
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content;
