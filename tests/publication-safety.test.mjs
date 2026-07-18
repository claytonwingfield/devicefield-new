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

test("Codex ingestion is private and creates only review-gated drafts", async () => {
  const endpoint = await source("app/api/internal/codex/drafts/route.ts");
  const helper = await source("scripts/submit-codex-draft.mjs");
  const migration = await source(
    "supabase/migrations/20260718005926_secure_codex_review_draft_ingest.sql",
  );
  const grants = await source(
    "supabase/migrations/20260718013402_grant_codex_ingest_service_role.sql",
  );
  const suggestions = await source(
    "supabase/migrations/20260718162726_add_article_affiliate_suggestions.sql",
  );
  const coverImages = await source(
    "supabase/migrations/20260718174755_article_cover_image_options.sql",
  );

  assert.match(endpoint, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(endpoint, /hasValidCodexDraftToken\(request\)/);
  assert.doesNotMatch(endpoint, /sharp/);
  assert.match(endpoint, /CODEX_DRAFT_COVER_IMAGE_COUNT/);
  assert.match(endpoint, /coverImageUploads/);
  assert.match(endpoint, /contentType: coverImage\.contentType/);
  assert.match(endpoint, /request\.formData\(\)/);
  assert.match(endpoint, /X-Devicefield-Run-ID|x-devicefield-run-id/);
  assert.match(endpoint, /rpc\(\s*"create_codex_review_draft"/);
  assert.match(endpoint, /p_suggestions: affiliateSuggestions/);
  assert.match(endpoint, /validateCodexBodyImage/);
  assert.match(endpoint, /devicefield-body-image:/);
  assert.match(endpoint, /body_image_urls/);
  assert.match(endpoint, /cover_image_urls/);
  assert.match(endpoint, /p_social_posts:\s*socialPosts/);
  assert.match(endpoint, /social_post_count:\s*socialPosts\.length/);
  assert.match(endpoint, /withUploadedImageCleanup/);
  assert.match(endpoint, /workflow_status: "ready_for_review"/);
  assert.doesNotMatch(endpoint, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(migration, /workflow_status = 'ready_for_review'/);
  assert.match(migration, /affiliate_program\.status = 'approved'/);
  assert.match(migration, /Codex run ID has already been submitted/);
  assert.match(
    migration,
    /REVOKE ALL ON FUNCTION public\.create_codex_review_draft\([\s\S]*FROM PUBLIC, anon, authenticated/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.create_codex_review_draft\([\s\S]*TO service_role/,
  );
  assert.match(helper, /process\.env\.CODEX_DRAFT_INGEST_URL/);
  assert.match(helper, /process\.env\.DEVICEFIELD_INGEST_AUTH/);
  assert.match(helper, /process\.env\.CODEX_DRAFT_INGEST_TOKEN/);
  assert.match(helper, /new FormData\(\)/);
  assert.match(helper, /imageArguments\.length !== 3/);
  assert.match(helper, /formData\.append\(\s*"featured_image"/);
  assert.match(helper, /result\.social_post_count !== 3/);
  assert.match(helper, /formData\.append\(\s*"body_image"/);
  assert.match(helper, /resolve\(dirname\(submissionPath\), "body-images"/);
  assert.doesNotMatch(helper, /SUPABASE_SECRET_KEY/);
  await assert.rejects(() => source("scripts/ingest-codex-draft.mjs"), {
    code: "ENOENT",
  });
  assert.match(grants, /GRANT SELECT ON public\.authors TO service_role/);
  assert.match(
    grants,
    /GRANT SELECT, INSERT, UPDATE ON public\.blog_posts TO service_role/,
  );
  assert.doesNotMatch(grants, /GRANT DELETE/);
  assert.match(suggestions, /CREATE TABLE public\.article_affiliate_suggestions/);
  assert.match(
    suggestions,
    /ALTER COLUMN affiliate_link_id DROP NOT NULL/,
  );
  assert.match(
    suggestions,
    /GRANT SELECT, UPDATE, DELETE ON public\.article_affiliate_suggestions[\s\S]*TO authenticated/,
  );
  assert.doesNotMatch(
    suggestions,
    /GRANT SELECT[^;]*article_affiliate_suggestions[^;]*TO anon/,
  );
  assert.match(suggestions, /review_status IN \('pending', 'shortlisted', 'dismissed'\)/);
  assert.match(suggestions, /blog_post\.slug = 'zebra-ds2208-shopify-pos'/);
  assert.match(suggestions, /'Amazon Associates'::TEXT/);
  assert.match(suggestions, /'B&H Affiliate Program'::TEXT/);
  assert.doesNotMatch(suggestions, /'approved'::TEXT/);
  assert.match(coverImages, /CREATE TABLE public\.article_cover_images/);
  assert.match(coverImages, /Exactly three cover image options are required/);
  assert.match(coverImages, /CREATE FUNCTION public\.select_article_cover_image/);
  assert.match(coverImages, /Published articles must be unpublished/);
  assert.doesNotMatch(
    coverImages,
    /GRANT SELECT[^;]*article_cover_images[^;]*TO anon/,
  );

  const socialPosts = await source(
    "supabase/migrations/20260718181443_article_social_posts.sql",
  );
  assert.match(socialPosts, /CREATE TABLE public\.article_social_posts/);
  assert.match(socialPosts, /ALTER TABLE public\.article_social_posts ENABLE ROW LEVEL SECURITY/);
  assert.match(socialPosts, /p_social_posts JSONB/);
  assert.doesNotMatch(
    socialPosts,
    /GRANT SELECT[^;]*article_social_posts[^;]*TO anon/,
  );
});

test("admin reviews private affiliate suggestions and unlinked products", async () => {
  const admin = await source("app/(default)/admin/page.tsx");
  const affiliateServer = await source("lib/affiliate/server.ts");

  assert.match(admin, /\.from\("article_affiliate_suggestions"\)/);
  assert.match(admin, /Suggested programs and placements/);
  assert.match(admin, /This does not approve or activate an affiliate program/);
  assert.match(admin, /affiliate_link_id: articleProductForm\.affiliateLinkId \|\| null/);
  assert.match(affiliateServer, /!row\.affiliate_link_id/);
});

test("admin displays and saves private social drafts per article", async () => {
  const admin = await source("app/(default)/admin/page.tsx");

  assert.match(admin, /\.from\("article_social_posts"\)/);
  assert.match(admin, /Social media drafts/);
  assert.match(admin, /Save social drafts/);
  assert.match(admin, /onConflict: "article_id,platform"/);
  assert.match(admin, /SOCIAL_PLATFORM_LIMITS/);
});

test("cover and inline image alt text have separate validation paths", async () => {
  const admin = await source("app/(default)/admin/page.tsx");
  const article = await source("app/(default)/blog/[slug]/page.tsx");
  const ingest = await source("lib/codex/draft-ingest.ts");

  assert.match(admin, /Alt text for a new inline image/);
  assert.match(admin, /featured image uses the[\s\S]*Cover image alt text/);
  assert.match(admin, /Generated cover options/);
  assert.match(admin, /select_article_cover_image/);
  assert.match(admin, /No inline body images are in this article/);
  assert.match(ingest, /Every inline body image must have descriptive alt text/);
  assert.match(ingest, /Exactly three cover image options are required/);
  assert.match(ingest, /cover_image_alt: coverImageAlt/);
  assert.match(article, /const coverImageAlt = getPostCoverImageAlt\(post\)/);
  assert.match(article, /alt=\{coverImageAlt\}/);
});

test("Codex article inventory is private and field-restricted", async () => {
  const endpoint = await source("app/api/internal/codex/articles/route.ts");
  const helper = await source("scripts/get-codex-article-inventory.mjs");

  assert.match(endpoint, /hasValidCodexDraftToken\(request\)/);
  assert.match(endpoint, /consumeCodexDraftRateLimit\(request\)/);
  assert.match(endpoint, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(endpoint, /\.from\("blog_posts"\)/);
  assert.match(endpoint, /\.from\("affiliate_links"\)/);
  assert.match(endpoint, /\.eq\("active", true\)/);
  assert.match(endpoint, /\.eq\("affiliate_programs\.status", "approved"\)/);
  assert.match(endpoint, /\.range\(from, from \+ ARTICLE_INVENTORY_PAGE_SIZE - 1\)/);
  assert.doesNotMatch(endpoint, /\.eq\("workflow_status"/);
  for (const field of [
    "id",
    "title",
    "slug",
    "focus_keyword",
    "category",
    "article_type",
    "testing_status",
    "workflow_status",
    "tags",
    "updated_at",
  ]) {
    assert.match(endpoint, new RegExp(`"${field}"`));
  }
  for (const prohibitedField of [
    "content",
    "internal_notes",
    "newsletter",
    "approved_at",
    "published_at",
  ]) {
    assert.doesNotMatch(endpoint, new RegExp(`"${prohibitedField}"`));
  }
  assert.doesNotMatch(endpoint, /destination_url/);
  assert.match(helper, /process\.env\.CODEX_DRAFT_INGEST_URL/);
  assert.match(helper, /process\.env\.DEVICEFIELD_INGEST_AUTH/);
  assert.match(helper, /process\.env\.CODEX_DRAFT_INGEST_TOKEN/);
  assert.match(helper, /\/api\/internal\/codex\/articles/);
  assert.match(helper, /affiliate_links: result\.affiliate_links/);
  assert.match(helper, /program_name/);
  assert.doesNotMatch(helper, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(helper, /dotenv|loadEnvFile|readFile\([^)]*\.env/);
});

test("configured authors resolve before their first article is published", async () => {
  const authorPage = await source("app/(default)/authors/[slug]/page.tsx");

  assert.match(authorPage, /if \(!author\) notFound\(\)/);
  assert.doesNotMatch(authorPage, /if \(authoredPosts\.length === 0\) notFound\(\)/);
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
  const confirmation = await source("app/api/newsletter/confirm/route.ts");
  const provider = await source("lib/newsletter/provider.ts");
  const migration = await source(
    "supabase/migrations/20260717195325_secure_newsletter_double_opt_in.sql",
  );
  assert.match(form, /fetch\("\/api\/newsletter\/subscribe"/);
  assert.match(endpoint, /hasAllowedRequestOrigin\(request\)/);
  assert.doesNotMatch(endpoint, /request\.nextUrl\.host/);
  assert.match(endpoint, /body\.company/);
  assert.match(endpoint, /rate_limited/);
  assert.match(confirmation, /getSameOriginUrl\(request, "\/"\)/);
  assert.doesNotMatch(confirmation, /new URL\([^\n]*request\.url/);
  assert.match(provider, /getSiteOrigin\(\)/);
  assert.doesNotMatch(provider, /process\.env\.SITE_URL/);
  assert.match(
    migration,
    /REVOKE INSERT ON public\.newsletter_subscribers FROM anon, authenticated/,
  );
  assert.match(migration, /confirm_newsletter_subscription/);
  assert.match(migration, /unsubscribe_newsletter/);
});
