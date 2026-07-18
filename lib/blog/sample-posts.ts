import type { BlogPost } from "./types";

const now = new Date("2026-07-16T12:00:00.000Z").toISOString();

const editorialDefaults: Pick<
  BlogPost,
  | "article_type"
  | "testing_status"
  | "workflow_status"
  | "author_id"
  | "reviewer_id"
  | "reviewed_at"
  | "last_verified_at"
  | "next_review_at"
  | "sources"
  | "claims"
  | "quick_verdict"
  | "compatibility_notes"
  | "limitations"
  | "testing_method"
  | "original_evidence"
  | "approved_at"
  | "scheduled_for"
  | "last_reviewed_at"
  | "internal_notes"
> = {
  article_type: "buying_guide",
  testing_status: "researched",
  workflow_status: "published",
  author_id: null,
  reviewer_id: null,
  reviewed_at: null,
  last_verified_at: null,
  next_review_at: null,
  sources: [],
  claims: [],
  quick_verdict: {},
  compatibility_notes: null,
  limitations: null,
  testing_method: null,
  original_evidence: [],
  approved_at: now,
  scheduled_for: null,
  last_reviewed_at: null,
  internal_notes: null,
};

export const samplePosts: BlogPost[] = [
  {
    id: "starter-operations-stack",
    title:
      "The 2026 small-business operations stack: devices, apps, and systems that actually compound",
    slug: "small-business-operations-stack-2026",
    excerpt:
      "A practical framework for choosing the devices, software, and workflows that reduce busywork instead of adding more tools to manage.",
    category: "Business Software",
    tags: ["operations", "workflow", "buying guide"],
    cover_image_url: null,
    cover_image_alt: "Small business operations stack planning board",
    focus_keyword: "small-business operations stack",
    seo_title: "Small-Business Operations Stack for 2026",
    meta_description:
      "Compare the 2026 small-business operations stack for devices, apps, and workflows that reduce busywork. See what to prioritize first.",
    canonical_url: null,
    faq_items: [],
    ...editorialDefaults,
    status: "published",
    featured: true,
    published_at: now,
    created_at: now,
    updated_at: now,
    content: `## Start with the workflow, not the tool

Modern businesses do not need more dashboards. They need fewer handoffs, clearer ownership, and systems that keep working when the founder is offline.

Before buying a new device or SaaS product, map the job it must improve. The best business stack usually covers five layers:

- Capture demand from search, social, referrals, and outbound.
- Convert demand with a clear website, checkout, scheduler, or quote flow.
- Operate the work with tasks, documents, automations, and customer records.
- Protect the business with secure access, backups, and device management.
- Measure the bottlenecks with analytics that point to a decision.

## What to prioritize first

If the business sells services, start with CRM, scheduling, proposal templates, and reporting. If it sells products, start with ecommerce, inventory visibility, support workflows, and email capture.

The right recommendation depends on the operating model. Devicefield reviews should make that tradeoff explicit: who the tool is best for, where it breaks down, and what to use instead.

## The evaluation lens

Every guide should consider implementation speed, total cost, switching risk, security posture, integrations, and the measurable business outcome.`,
  },
  {
    id: "starter-secure-remote-work",
    title: "Remote-work security checklist for lean teams",
    slug: "remote-work-security-checklist-lean-teams",
    excerpt:
      "A lightweight security baseline for businesses choosing laptops, VPNs, password managers, backups, and access policies.",
    category: "Networking & Uptime",
    tags: ["security", "remote work", "devices"],
    cover_image_url: null,
    cover_image_alt: "Remote-work security checklist for lean teams",
    focus_keyword: "remote-work security checklist",
    seo_title: "Remote-Work Security Checklist for Lean Teams",
    meta_description:
      "Use this remote-work security checklist to choose laptops, VPNs, password managers, backups, and access policies for lean teams.",
    canonical_url: null,
    faq_items: [],
    ...editorialDefaults,
    status: "published",
    featured: false,
    published_at: now,
    created_at: now,
    updated_at: now,
    content: `## Security should be boring

Small teams usually lose time and money through preventable basics: weak access control, unmanaged devices, poor backups, and unclear offboarding.

Build a baseline before buying advanced tools:

- Require a password manager and unique passwords.
- Enable multi-factor authentication on email, finance, hosting, and customer-data systems.
- Keep devices updated and encrypted.
- Use VPNs on untrusted networks when appropriate.
- Keep shared documents in managed workspaces, not personal drives.
- Review account access every quarter.

## Device choices matter

The best laptop or phone for business is not only the fastest one. It is the one your team can update, secure, replace, and support with minimal disruption.

## What to review next

Security buying guides should compare products by setup friction, team controls, logging, recovery options, and total operational burden.`,
  },
];
