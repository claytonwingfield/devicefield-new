"use client";

import { useEffect, useState } from "react";
import type {
  AffiliateLink,
  AffiliateProgram,
} from "@/lib/affiliate/types";
import type { BlogPost } from "@/lib/blog/types";
import {
  createNewsletterCampaignDraft,
  formatNewsletterCampaignStatus,
  getNextMondaySixPmLocal,
  renderNewsletterCampaign,
  type NewsletterAffiliateLink,
  type NewsletterCampaign,
  type NewsletterCampaignDraft,
  type NewsletterCampaignStatus,
} from "@/lib/newsletter/campaigns";

type CampaignAction =
  | "save_draft"
  | "mark_ready"
  | "return_to_draft"
  | "approve"
  | "schedule"
  | "archive";

type Props = {
  posts: BlogPost[];
  affiliateLinks: AffiliateLink[];
  affiliatePrograms: AffiliateProgram[];
};

function toDraft(campaign: NewsletterCampaign): NewsletterCampaignDraft {
  return {
    name: campaign.name,
    subject: campaign.subject,
    preheader: campaign.preheader,
    content: campaign.content,
  };
}

function statusTone(status: NewsletterCampaignStatus) {
  if (status === "ready_for_review") return "bg-amber-100 text-amber-900";
  if (status === "approved") return "bg-lime-200 text-zinc-950";
  if (status === "scheduled") return "bg-sky-100 text-sky-900";
  if (status === "sent") return "bg-emerald-100 text-emerald-900";
  return "bg-zinc-100 text-zinc-600";
}

export default function NewsletterCampaigns({
  posts,
  affiliateLinks,
  affiliatePrograms,
}: Props) {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsletterCampaignDraft>(() =>
    createNewsletterCampaignDraft(),
  );
  const [scheduledFor, setScheduledFor] = useState(() =>
    getNextMondaySixPmLocal(),
  );
  const [broadcastConfigured, setBroadcastConfigured] = useState(false);
  const [renderedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publishedPosts = posts.filter(
    (post) =>
      post.workflow_status === "published" &&
      post.published_at &&
      new Date(post.published_at).getTime() <= renderedAt,
  );
  const approvedLinks = affiliateLinks
    .filter((link) => {
      const program = affiliatePrograms.find(
        (item) => item.id === link.program_id,
      );
      return link.active && program?.status === "approved";
    })
    .map<NewsletterAffiliateLink>((link) => ({
      ...link,
      affiliate_programs: affiliatePrograms.find(
        (program) => program.id === link.program_id,
      ),
    }));
  const currentCampaign = campaigns.find((item) => item.id === editingId);
  const currentStatus = currentCampaign?.status ?? "draft";
  const fieldsDisabled = currentStatus !== "draft";
  const rendered = renderNewsletterCampaign({
    campaign: draft,
    articles: publishedPosts,
    affiliateLinks: approvedLinks,
  });

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/newsletters", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          campaigns?: NewsletterCampaign[];
          broadcastConfigured?: boolean;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error || "Campaigns could not be loaded.");
        }
        return result;
      })
      .then((result) => {
        if (cancelled) return;
        const nextCampaigns = result.campaigns ?? [];
        setCampaigns(nextCampaigns);
        setBroadcastConfigured(Boolean(result.broadcastConfigured));
        const reviewCampaign = nextCampaigns.find(
          (campaign) => campaign.status === "ready_for_review",
        );
        if (reviewCampaign) {
          setEditingId(reviewCampaign.id);
          setDraft(toDraft(reviewCampaign));
        }
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Campaigns could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function selectCampaign(campaign: NewsletterCampaign) {
    setEditingId(campaign.id);
    setDraft(toDraft(campaign));
    setScheduledFor(
      campaign.scheduled_for
        ? new Date(
            new Date(campaign.scheduled_for).getTime() -
              new Date(campaign.scheduled_for).getTimezoneOffset() * 60_000,
          )
            .toISOString()
            .slice(0, 16)
        : getNextMondaySixPmLocal(),
    );
    setMessage(null);
    setError(null);
    document
      .getElementById("newsletter-campaign-preview")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startNewCampaign() {
    setEditingId(null);
    setDraft(createNewsletterCampaignDraft());
    setScheduledFor(getNextMondaySixPmLocal());
    setMessage(null);
    setError(null);
  }

  async function syncConfirmedContacts() {
    setSyncingContacts(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/newsletters/sync", {
        method: "POST",
      });
      const result = (await response.json()) as {
        synchronized?: number;
        failed?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Subscriber synchronization failed.");
      }
      setMessage(
        `${result.synchronized ?? 0} confirmed contacts synchronized to Resend${result.failed ? `; ${result.failed} failed` : ""}.`,
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Subscriber synchronization failed.",
      );
    } finally {
      setSyncingContacts(false);
    }
  }

  async function runAction(action: CampaignAction) {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const scheduleIso = scheduledFor
        ? new Date(scheduledFor).toISOString()
        : null;
      const response = await fetch("/api/admin/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          campaignId: editingId,
          campaign: draft,
          scheduledFor: scheduleIso,
        }),
      });
      const result = (await response.json()) as {
        campaign?: NewsletterCampaign;
        error?: string;
      };
      if (!response.ok || !result.campaign) {
        throw new Error(result.error || "Campaign action failed.");
      }
      setEditingId(result.campaign.id);
      setDraft(toDraft(result.campaign));
      setCampaigns((current) =>
        [result.campaign!, ...current.filter((item) => item.id !== result.campaign!.id)].sort(
          (left, right) =>
            new Date(right.updated_at).getTime() -
            new Date(left.updated_at).getTime(),
        ),
      );
      setMessage(
        action === "schedule"
          ? "Campaign scheduled for Monday at 6:00 PM Central."
          : `Campaign ${action.replaceAll("_", " ")} completed.`,
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Campaign action failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleSupportingArticle(slug: string) {
    setDraft((current) => {
      const selected = current.content.supporting_article_slugs;
      const next = selected.includes(slug)
        ? selected.filter((item) => item !== slug)
        : [...selected, slug].slice(0, 3);
      return { ...current, content: { ...current.content, supporting_article_slugs: next } };
    });
  }

  return (
    <div className="space-y-6">
      <section
        id="newsletter-campaign-preview"
        className="scroll-mt-28 rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              Weekly edition
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              Devicefield Field Notes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              One lead theme, one featured guide, up to three supporting reads,
              one operator tip, and at most one relevant partner recommendation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void syncConfirmedContacts()}
              disabled={syncingContacts || !broadcastConfigured}
              className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingContacts ? "Syncing..." : "Sync confirmed contacts"}
            </button>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusTone(currentStatus)}`}
            >
              {formatNewsletterCampaignStatus(currentStatus)}
            </span>
          </div>
        </div>

        {(message || error) && (
          <p
            className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-lime-300 bg-lime-50 text-zinc-900"
            }`}
          >
            {error ?? message}
          </p>
        )}
        {rendered.warnings.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {rendered.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-100">
          <iframe
            title="Newsletter email preview"
            srcDoc={rendered.html}
            sandbox=""
            className="h-[760px] w-full bg-zinc-100"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                Review queue
              </p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">
                Weekly issues
              </h2>
            </div>
            <button
              type="button"
              onClick={startNewCampaign}
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
            >
              New issue
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                onClick={() => selectCampaign(campaign)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  editingId === campaign.id
                    ? "border-lime-400 bg-lime-50"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-zinc-950">
                    {campaign.name}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone(campaign.status)}`}>
                    {formatNewsletterCampaignStatus(campaign.status)}
                  </span>
                </div>
                <span className="mt-2 block line-clamp-2 text-sm text-zinc-500">
                  {campaign.subject}
                </span>
              </button>
            ))}
            {!loading && campaigns.length === 0 && (
              <p className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">
                No weekly issues yet. The editor is prefilled with the reusable
                Field Notes template.
              </p>
            )}
            {loading && <p className="text-sm text-zinc-500">Loading issues...</p>}
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Internal issue name</span>
              <input
                value={draft.name}
                disabled={fieldsDisabled}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="form-input w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Subject line</span>
              <input
                value={draft.subject}
                disabled={fieldsDisabled}
                onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                className="form-input w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Preview text</span>
              <textarea
                value={draft.preheader}
                disabled={fieldsDisabled}
                rows={2}
                onChange={(event) => setDraft((current) => ({ ...current, preheader: event.target.value }))}
                className="form-textarea w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
              />
            </label>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">Lead heading</span>
                <input
                  value={draft.content.lead_heading}
                  disabled={fieldsDisabled}
                  onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, lead_heading: event.target.value } }))}
                  className="form-input w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">Issue label</span>
                <input
                  value={draft.content.issue_label}
                  disabled={fieldsDisabled}
                  onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, issue_label: event.target.value } }))}
                  className="form-input w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Lead copy</span>
              <textarea
                value={draft.content.lead_copy}
                disabled={fieldsDisabled}
                rows={4}
                onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, lead_copy: event.target.value } }))}
                className="form-textarea w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Featured article</span>
              <select
                value={draft.content.featured_article_slug ?? ""}
                disabled={fieldsDisabled}
                onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, featured_article_slug: event.target.value || null, supporting_article_slugs: current.content.supporting_article_slugs.filter((slug) => slug !== event.target.value) } }))}
                className="form-select w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
              >
                <option value="">Select a published article</option>
                {publishedPosts.map((post) => <option key={post.id} value={post.slug}>{post.title}</option>)}
              </select>
            </label>

            <fieldset disabled={fieldsDisabled} className="rounded-2xl border border-zinc-200 p-4 disabled:bg-zinc-50">
              <legend className="px-2 text-sm font-semibold text-zinc-800">Supporting articles (up to 3)</legend>
              <div className="mt-2 grid gap-2">
                {publishedPosts.filter((post) => post.slug !== draft.content.featured_article_slug).map((post) => (
                  <label key={post.id} className="flex items-start gap-3 rounded-xl p-2 hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={draft.content.supporting_article_slugs.includes(post.slug)}
                      onChange={() => toggleSupportingArticle(post.slug)}
                      className="form-checkbox mt-1 rounded border-zinc-300 text-zinc-950"
                    />
                    <span className="text-sm leading-6 text-zinc-700">{post.title}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">Practical tip heading</span>
                <input
                  value={draft.content.practical_tip_heading}
                  disabled={fieldsDisabled}
                  onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, practical_tip_heading: event.target.value } }))}
                  className="form-input w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
                />
              </label>
              <label className="block lg:row-span-2">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">Practical tip</span>
                <textarea
                  value={draft.content.practical_tip_copy}
                  disabled={fieldsDisabled}
                  rows={5}
                  onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, practical_tip_copy: event.target.value } }))}
                  className="form-textarea w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-lime-300 bg-lime-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-800">Optional partner recommendation</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Use no more than one approved link, only when it directly helps this issue&apos;s reader.</p>
              <div className="mt-4 grid gap-4">
                <select
                  value={draft.content.affiliate_link_slug ?? ""}
                  disabled={fieldsDisabled}
                  onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, affiliate_link_slug: event.target.value || null } }))}
                  className="form-select w-full rounded-2xl border-lime-300 bg-white disabled:bg-zinc-100"
                >
                  <option value="">No affiliate recommendation</option>
                  {approvedLinks.map((link) => <option key={link.id} value={link.slug}>{link.affiliate_programs?.name}: {link.label}</option>)}
                </select>
                {draft.content.affiliate_link_slug && (
                  <>
                    <input
                      value={draft.content.affiliate_heading}
                      disabled={fieldsDisabled}
                      onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, affiliate_heading: event.target.value } }))}
                      className="form-input w-full rounded-2xl border-lime-300 bg-white disabled:bg-zinc-100"
                      placeholder="Recommendation heading"
                    />
                    <textarea
                      value={draft.content.affiliate_copy}
                      disabled={fieldsDisabled}
                      rows={3}
                      onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, affiliate_copy: event.target.value } }))}
                      className="form-textarea w-full rounded-2xl border-lime-300 bg-white disabled:bg-zinc-100"
                      placeholder="Why this is relevant to this issue"
                    />
                    <input
                      value={draft.content.affiliate_cta_label}
                      disabled={fieldsDisabled}
                      onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, affiliate_cta_label: event.target.value } }))}
                      className="form-input w-full rounded-2xl border-lime-300 bg-white disabled:bg-zinc-100"
                      placeholder="View current pricing"
                    />
                  </>
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Closing note</span>
              <textarea
                value={draft.content.closing_copy}
                disabled={fieldsDisabled}
                rows={3}
                onChange={(event) => setDraft((current) => ({ ...current, content: { ...current.content, closing_copy: event.target.value } }))}
                className="form-textarea w-full rounded-2xl border-zinc-200 disabled:bg-zinc-100"
              />
            </label>

            {currentStatus === "approved" && (
              <label className="block rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <span className="mb-2 block text-sm font-semibold text-sky-950">Monday send time (America/Chicago)</span>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  className="form-input w-full rounded-2xl border-sky-200 bg-white"
                />
                <span className="mt-2 block text-xs leading-5 text-sky-900">The server only accepts a future Monday at exactly 6:00 PM Central.</span>
              </label>
            )}

            <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-5">
              {currentStatus === "draft" && (
                <>
                  <button type="button" disabled={saving} onClick={() => void runAction("save_draft")} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50">Save draft</button>
                  <button type="button" disabled={saving || rendered.warnings.length > 0} onClick={() => void runAction("mark_ready")} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Mark ready for review</button>
                </>
              )}
              {currentStatus === "ready_for_review" && (
                <>
                  <button type="button" disabled={saving} onClick={() => void runAction("return_to_draft")} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50">Return to draft</button>
                  <button type="button" disabled={saving || rendered.warnings.length > 0} onClick={() => void runAction("approve")} className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50">Approve issue</button>
                </>
              )}
              {currentStatus === "approved" && (
                <>
                  <button type="button" disabled={saving} onClick={() => void runAction("return_to_draft")} className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50">Return to draft</button>
                  <button type="button" disabled={saving || !broadcastConfigured || rendered.warnings.length > 0} onClick={() => void runAction("schedule")} className="rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Schedule Monday 6 PM</button>
                </>
              )}
              {editingId && ["draft", "ready_for_review", "approved"].includes(currentStatus) && (
                <button type="button" disabled={saving} onClick={() => void runAction("archive")} className="ml-auto rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50">Archive</button>
              )}
            </div>
            {!broadcastConfigured && currentStatus === "approved" && (
              <p className="text-sm text-amber-800">Scheduling is disabled until RESEND_NEWSLETTER_SEGMENT_ID is configured on the deployed website.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
