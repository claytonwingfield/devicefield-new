CREATE TABLE public.newsletter_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 3 AND 120),
  subject TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(subject)) BETWEEN 3 AND 160),
  preheader TEXT NOT NULL DEFAULT '' CHECK (CHAR_LENGTH(preheader) <= 220),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'ready_for_review',
      'approved',
      'scheduled',
      'sent',
      'archived'
    )),
  content JSONB NOT NULL DEFAULT '{}'::JSONB
    CHECK (JSONB_TYPEOF(content) = 'object'),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  resend_broadcast_id TEXT,
  resend_status TEXT,
  source TEXT NOT NULL DEFAULT 'admin'
    CHECK (source IN ('admin', 'codex')),
  codex_run_id TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT newsletter_campaign_schedule_required CHECK (
    status NOT IN ('scheduled', 'sent') OR scheduled_for IS NOT NULL
  ),
  CONSTRAINT newsletter_campaign_broadcast_required CHECK (
    status NOT IN ('scheduled', 'sent') OR resend_broadcast_id IS NOT NULL
  )
);

CREATE INDEX idx_newsletter_campaigns_status_updated
  ON public.newsletter_campaigns(status, updated_at DESC);
CREATE INDEX idx_newsletter_campaigns_scheduled
  ON public.newsletter_campaigns(scheduled_for)
  WHERE status = 'scheduled';

CREATE TRIGGER set_newsletter_campaigns_updated_at
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read newsletter campaigns"
  ON public.newsletter_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create newsletter campaigns"
  ON public.newsletter_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Admins can update newsletter campaigns"
  ON public.newsletter_campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete newsletter campaigns"
  ON public.newsletter_campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

REVOKE ALL ON public.newsletter_campaigns FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campaigns
  TO authenticated;
GRANT ALL ON public.newsletter_campaigns TO service_role;

COMMENT ON TABLE public.newsletter_campaigns IS
  'Private, approval-gated Devicefield newsletter drafts and Resend broadcast state.';
