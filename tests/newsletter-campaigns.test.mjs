import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

async function loadCampaignUtilities() {
  const result = await build({
    entryPoints: [new URL("lib/newsletter/campaigns.ts", root).pathname],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    logLevel: "silent",
  });
  const bundledModule = { exports: {} };
  const execute = new Function(
    "require",
    "module",
    "exports",
    result.outputFiles[0].text,
  );
  execute(require, bundledModule, bundledModule.exports);
  return bundledModule.exports;
}

function article(slug = "barcode-scanner-guide") {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Barcode Scanner Deployment Guide",
    slug,
    excerpt: "Choose and deploy a scanner without missing compatibility details.",
    category: "Barcode & Inventory",
    cover_image_url: "https://devicefield.com/example.webp",
    cover_image_alt: "Barcode scanner deployment diagram",
    workflow_status: "published",
    published_at: "2026-07-18T12:00:00.000Z",
  };
}

test("newsletter campaign validation requires complete structured content", async () => {
  const utilities = await loadCampaignUtilities();
  const draft = utilities.createNewsletterCampaignDraft(
    new Date("2026-07-18T12:00:00.000Z"),
  );
  assert.equal(utilities.validateNewsletterCampaignDraft(draft).ok, true);
  assert.equal(
    utilities.validateNewsletterCampaignDraft({
      ...draft,
      content: { ...draft.content, lead_heading: "" },
    }).ok,
    false,
  );
});

test("email template includes compliance footer and conditional affiliate disclosure", async () => {
  const utilities = await loadCampaignUtilities();
  const base = utilities.createNewsletterCampaignDraft();
  const campaign = {
    ...base,
    content: {
      ...base.content,
      featured_article_slug: "barcode-scanner-guide",
      affiliate_link_slug: "approved-scanner",
      affiliate_heading: "Scanner option",
      affiliate_copy: "Consider this only when it matches the documented POS connection.",
    },
  };
  const withAffiliate = utilities.renderNewsletterCampaign({
    campaign,
    articles: [article()],
    affiliateLinks: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        slug: "approved-scanner",
        label: "View current pricing",
        destination_url: "https://example.com/product",
        use_redirect: true,
        active: true,
        affiliate_programs: { name: "Example", status: "approved" },
      },
    ],
  });
  assert.deepEqual(withAffiliate.warnings, []);
  assert.match(withAffiliate.html, /Affiliate disclosure:/);
  assert.match(withAffiliate.html, /rel="sponsored nofollow"/);
  assert.match(withAffiliate.html, /3509 N Mueller Ave, Bethany, OK 73008/);
  assert.match(withAffiliate.html, /\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/);

  const withoutAffiliate = utilities.renderNewsletterCampaign({
    campaign: {
      ...campaign,
      content: { ...campaign.content, affiliate_link_slug: null },
    },
    articles: [article()],
    affiliateLinks: [],
  });
  assert.doesNotMatch(withoutAffiliate.html, /Affiliate disclosure:/);
});

test("newsletter campaigns and Codex ingestion remain private and review gated", async () => {
  const migration = await readFile(
    new URL(
      "supabase/migrations/20260719003844_weekly_newsletter_campaigns.sql",
      root,
    ),
    "utf8",
  );
  const route = await readFile(
    new URL("app/api/internal/codex/newsletters/route.ts", root),
    "utf8",
  );
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /profiles\.role = 'admin'/);
  assert.match(migration, /REVOKE ALL ON public\.newsletter_campaigns FROM anon/);
  assert.match(route, /status: "ready_for_review"/);
  assert.doesNotMatch(route, /status: "scheduled"|status: "sent"/);
  assert.match(route, /hasValidCodexDraftToken/);
});
