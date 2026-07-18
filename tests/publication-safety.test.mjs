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

async function loadSearchUtilities() {
  const result = await build({
    entryPoints: [new URL("lib/blog/search.ts", root).pathname],
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
    "supabase/migrations/20260718001334_atomic_article_workflow_and_affiliate_visibility.sql",
  );
  assert.match(
    migration,
    /NEW\.workflow_status = 'published'[\s\S]*OLD\.workflow_status NOT IN \('approved', 'scheduled'\)/,
  );
  assert.match(
    migration,
    /NEW\.workflow_status = 'scheduled'[\s\S]*OLD\.workflow_status <> 'approved'/,
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
    "supabase/migrations/20260718001334_atomic_article_workflow_and_affiliate_visibility.sql",
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
    /persist_article_workflow[\s\S]*profiles\.role = 'admin'/,
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

test("publication navigation has one query-aware active entry", async () => {
  const header = await source("components/ui/header-client.tsx");
  assert.match(header, /useSearchParams/);
  assert.match(header, /itemPath !== "\/blog" \|\| !searchParams\.has\("type"\)/);
  assert.match(header, /searchParams\.get\(key\) === value/);
  assert.doesNotMatch(header, /pathname\.startsWith\("\/category"\)/);
});

test("nested publication 404 pages do not render a second footer", async () => {
  const nestedNotFound = await source("app/(default)/not-found.tsx");
  const rootNotFound = await source("app/not-found.tsx");
  assert.match(nestedNotFound, /<NotFoundContent \/>/);
  assert.doesNotMatch(nestedNotFound, /<Footer|<Header/);
  assert.match(rootNotFound, /<Footer \/>/);
  assert.match(rootNotFound, /<Header \/>/);
});

test("header search suggests published articles and submits to filtered results", async () => {
  const combobox = await source("components/search/search-combobox.tsx");
  const searchPage = await source("app/(default)/search/page.tsx");
  assert.match(combobox, /form action="\/search" method="get"/);
  assert.match(combobox, /findSearchSuggestions/);
  assert.match(combobox, /event\.key === "ArrowDown"/);
  assert.match(combobox, /event\.key === "Enter" && activeIndex >= 0/);
  for (const filter of ["category", "type", "testing", "sort"]) {
    assert.match(searchPage, new RegExp(`name="${filter}"`));
  }
  assert.match(searchPage, /robots: \{ index: false, follow: true \}/);
});

test("search relevance and structured filters share one implementation", async () => {
  const { findSearchSuggestions, searchPublishedPosts } =
    await loadSearchUtilities();
  const posts = [
    {
      id: "one",
      slug: "zebra-ds2208-review",
      title: "Zebra DS2208 Barcode Scanner Review",
      excerpt: "A researched scanner review for retail inventory workflows.",
      content: "Compatibility notes for barcode inventory systems.",
      category: "Barcode & Inventory",
      tags: ["scanner", "barcode"],
      article_type: "review",
      testing_status: "researched",
      published_at: "2026-07-16T00:00:00.000Z",
      created_at: "2026-07-16T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
    },
    {
      id: "two",
      slug: "receipt-printer-setup",
      title: "Receipt Printer Setup Guide",
      excerpt: "Connect and configure a thermal receipt printer.",
      content: "Driver and network setup instructions.",
      category: "Receipt & Label Printing",
      tags: ["printer", "setup"],
      article_type: "setup_guide",
      testing_status: "tested",
      published_at: "2026-07-17T00:00:00.000Z",
      created_at: "2026-07-17T00:00:00.000Z",
      updated_at: "2026-07-17T00:00:00.000Z",
    },
  ];

  assert.equal(findSearchSuggestions(posts, "barcode scanner")[0].id, "one");
  assert.deepEqual(
    searchPublishedPosts(posts, {
      query: "printer",
      articleType: "setup_guide",
      testingStatus: "tested",
      sort: "relevance",
    }).map((post) => post.id),
    ["two"],
  );
});

test("drafts and archived articles are excluded from public queries", async () => {
  const server = await source("lib/blog/server.ts");
  const migration = await source(
    "supabase/migrations/20260718001334_atomic_article_workflow_and_affiliate_visibility.sql",
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

test("article content and workflow are persisted atomically", async () => {
  const admin = await source("app/(default)/admin/page.tsx");
  const endpoint = await source("app/api/admin/articles/persist/route.ts");
  const migration = await source(
    "supabase/migrations/20260718001334_atomic_article_workflow_and_affiliate_visibility.sql",
  );

  assert.match(admin, /fetch\("\/api\/admin\/articles\/persist"/);
  assert.doesNotMatch(admin, /\.from\("blog_posts"\)\s*\.update\(payload\)/);
  assert.doesNotMatch(admin, /transition_article_workflow/);
  assert.match(endpoint, /rpc\("persist_article_workflow"/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(
    migration,
    /Published articles must be unpublished before content editing/,
  );
});

test("Codex ingestion is server-only and limited to researched drafts", async () => {
  const endpoint = await source("app/api/internal/codex/drafts/route.ts");
  const migration = await source(
    "supabase/migrations/20260718004059_add_codex_draft_ingest.sql",
  );

  assert.match(endpoint, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(endpoint, /hasValidCodexDraftToken\(request\)/);
  assert.match(endpoint, /rpc\("ingest_codex_draft"/);
  assert.doesNotMatch(endpoint, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(migration, /testing_status,\s*workflow_status/);
  assert.match(migration, /'researched',\s*'draft'/);
  assert.match(
    migration,
    /REVOKE ALL ON FUNCTION public\.ingest_codex_draft\(JSONB\)[\s\S]*FROM PUBLIC, anon, authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.ingest_codex_draft\(JSONB\)[\s\S]*TO service_role/,
  );
});

test("workflow changes trigger on-demand public route revalidation", async () => {
  const endpoint = await source("app/api/admin/articles/persist/route.ts");
  for (const path of [
    "/",
    "/blog",
    "/blog/[slug]",
    "/category/[slug]",
    "/sitemap.xml",
    "/feed.xml",
  ]) {
    assert.ok(endpoint.includes(`revalidatePath("${path}"`));
  }
});

test("affiliate visibility requires an active link and approved program", async () => {
  const server = await source("lib/affiliate/server.ts");
  const migration = await source(
    "supabase/migrations/20260718001334_atomic_article_workflow_and_affiliate_visibility.sql",
  );

  assert.match(server, /\.eq\("active", true\)/);
  assert.match(server, /affiliate_programs\?\.status === "approved"/);
  assert.match(
    migration,
    /affiliate_links\.active = true[\s\S]*affiliate_programs\.status = 'approved'/,
  );
  assert.match(
    migration,
    /Affiliate links can be activated only for approved programs/,
  );
});

test("sign-in accepts only configured same-origin requests", async () => {
  const signIn = await source("app/auth/sign-in/route.ts");
  const callback = await source("app/auth/callback/route.ts");
  const origin = await source("lib/site-origin.ts");

  assert.match(signIn, /hasAllowedRequestOrigin\(request\)/);
  assert.match(signIn, /getSameOriginUrl\(request, "\/admin"\)/);
  assert.match(callback, /!requestedNext\.startsWith\("\/\/"\)/);
  assert.match(origin, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(origin, /https:\/\/devicefield\.com/);
  assert.match(origin, /process\.env\.NODE_ENV !== "development"/);
  assert.doesNotMatch(signIn, /x-forwarded-host/);
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

test("Supabase auth uses Firebase Hosting's forwarded session cookie", async () => {
  const cookieConfig = await source("lib/supabase/auth-cookies.ts");
  const clients = await Promise.all(
    [
      "app/auth/sign-in/route.ts",
      "lib/supabase/client.ts",
      "lib/supabase/server.ts",
      "proxy.ts",
    ].map(source),
  );

  assert.match(cookieConfig, /name: "__session"/);
  assert.match(cookieConfig, /SUPABASE_AUTH_COOKIE_ENCODING = "raw"/);
  for (const client of clients) {
    assert.match(client, /SUPABASE_AUTH_COOKIE_OPTIONS/);
    assert.match(client, /SUPABASE_AUTH_COOKIE_ENCODING/);
  }
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
