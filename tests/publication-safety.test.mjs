import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function loadProductionBlogServer() {
  const result = await build({
    entryPoints: [new URL("lib/blog/server.ts", root).pathname],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
  });
  const module = { exports: {} };
  const execute = new Function(
    "require",
    "module",
    "exports",
    result.outputFiles[0].text,
  );
  execute(require, module, module.exports);
  return module.exports;
}

test("production never returns sample posts when Supabase is unavailable", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const previousConsoleError = console.error;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  console.error = () => {};
  try {
    const server = await loadProductionBlogServer();
    assert.deepEqual(await server.getPublishedPosts(), []);
    assert.equal(
      await server.getPostBySlug("how-we-test-business-tools"),
      null,
    );
  } finally {
    console.error = previousConsoleError;
    if (previousUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey)
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test("publishing and scheduling require a prior approved state", async () => {
  const migration = await source(
    "supabase/migrations/20260717200609_publication_editorial_workflow.sql",
  );
  assert.match(
    migration,
    /NEW\.workflow_status = 'published' AND OLD\.workflow_status <> 'approved'/,
  );
  assert.match(
    migration,
    /OLD\.workflow_status <> 'approved'[\s\S]*must be approved before it can be scheduled/,
  );
  assert.match(migration, /New articles must start as draft/);
  assert.match(
    migration,
    /scheduled_for IS NULL OR NEW\.scheduled_for <= NOW\(\)/,
  );
});

test("non-admin writers and automation identities cannot publish", async () => {
  const base = await source(
    "supabase/migrations/20260716200545_devicefield_blog_cms.sql",
  );
  const workflow = await source(
    "supabase/migrations/20260717200609_publication_editorial_workflow.sql",
  );
  assert.match(
    base,
    /Admins can insert blog posts[\s\S]*profiles\.role = 'admin'/,
  );
  assert.match(
    base,
    /Admins can update blog posts[\s\S]*profiles\.role = 'admin'/,
  );
  assert.match(
    workflow,
    /transition_article_workflow[\s\S]*profiles\.role = 'admin'/,
  );
  assert.doesNotMatch(workflow, /role\s*=\s*'automation'/);
});

test("CMS data mirrors the current homepage and liquid-glass navigation", async () => {
  const cms = await source(
    "supabase/migrations/20260717210314_sync_publication_cms_content.sql",
  );
  const header = await source("components/ui/header-client.tsx");
  assert.match(cms, /"categoryEntries"/);
  assert.match(cms, /"heroEvaluation"/);
  assert.match(cms, /"trustStrip"/);
  assert.doesNotMatch(cms, /"focusAreas"|"coverageLabel"/);
  assert.match(header, /bg-white\/65/);
  assert.match(header, /backdrop-blur-2xl/);
  assert.match(header, /backdrop-saturate-150/);
});

test("drafts and archived articles are excluded from public queries", async () => {
  const server = await source("lib/blog/server.ts");
  const migration = await source(
    "supabase/migrations/20260717200609_publication_editorial_workflow.sql",
  );
  assert.match(server, /\.eq\("workflow_status", "published"\)/);
  assert.match(server, /\.not\("published_at", "is", null\)/);
  assert.match(
    server,
    /\.lte\("published_at", new Date\(\)\.toISOString\(\)\)/,
  );
  assert.match(
    migration,
    /workflow_status = 'published'[\s\S]*published_at IS NOT NULL[\s\S]*published_at <= NOW\(\)/,
  );
});

test("affiliate links are labeled sponsored nofollow and disclosure is conditional", async () => {
  const button = await source("components/affiliate/AffiliateButton.tsx");
  const article = await source("app/(default)/blog/[slug]/page.tsx");
  assert.match(button, /rel="sponsored nofollow"/);
  assert.match(button, /target="_blank"/);
  assert.match(article, /hasAffiliateLinks && \(/);
  assert.doesNotMatch(article, /<AffiliateDisclosure \/>/);
});

test("anonymous clients cannot directly insert affiliate click events", async () => {
  const migration = await source(
    "supabase/migrations/20260717194212_article_products_secure_click_tracking.sql",
  );
  assert.match(
    migration,
    /REVOKE INSERT ON public\.affiliate_click_events FROM anon, authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.record_affiliate_click[\s\S]*TO service_role/,
  );
  assert.doesNotMatch(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.record_affiliate_click[\s\S]*TO anon/,
  );
});

test("admin, login, and preview pages are noindex", async () => {
  const admin = await source("app/(default)/admin/layout.tsx");
  const login = await source("app/(auth)/devicefield-editor-login/page.tsx");
  const preview = await source("app/(preview)/preview/[id]/page.tsx");
  for (const file of [admin, login, preview]) {
    assert.match(file, /robots:\s*\{ index: false, follow: false/);
  }
  assert.match(admin, /profile\?\.role !== "admin"/);
  assert.match(preview, /Preview mode:/);
});

test("sitemap includes every public trust page and RSS", async () => {
  const sitemap = await source("app/sitemap.ts");
  for (const path of [
    "/about",
    "/contact",
    "/review-methodology",
    "/editorial-policy",
    "/affiliate-disclosure",
    "/privacy",
    "/terms",
    "/feed.xml",
  ]) {
    assert.match(sitemap, new RegExp(path.replace("/", "\\/")));
  }
  assert.doesNotMatch(sitemap, /samplePosts/);
});

test("empty categories are not rendered or added to the sitemap", async () => {
  const index = await source("app/(default)/blog/page.tsx");
  const category = await source("app/(default)/category/[slug]/page.tsx");
  const sitemap = await source("app/sitemap.ts");
  assert.match(
    index,
    /return count > 0 \? \[\{ \.\.\.category, count \}\] : \[\]/,
  );
  assert.match(category, /if \(posts\.length === 0\) notFound\(\)/);
  assert.match(
    sitemap,
    /posts\.some\(\(post\) => post\.category === category\.name\)/,
  );
});

test("newsletter subscriptions stay behind server endpoints and double opt-in", async () => {
  const form = await source("components/newsletter-form.tsx");
  const endpoint = await source("app/api/newsletter/subscribe/route.ts");
  const migration = await source(
    "supabase/migrations/20260717195325_secure_newsletter_double_opt_in.sql",
  );
  assert.match(form, /fetch\("\/api\/newsletter\/subscribe"/);
  assert.match(endpoint, /body\.company/);
  assert.match(endpoint, /rate_limited/);
  assert.match(
    migration,
    /REVOKE INSERT ON public\.newsletter_subscribers FROM anon, authenticated/,
  );
  assert.match(migration, /confirm_newsletter_subscription/);
  assert.match(migration, /unsubscribe_newsletter/);
});
