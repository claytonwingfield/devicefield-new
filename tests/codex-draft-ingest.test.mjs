import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

async function loadDraftIngestUtilities() {
  const result = await build({
    entryPoints: [new URL("lib/codex/draft-ingest.ts", root).pathname],
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

function validDraft(overrides = {}) {
  return {
    title: "Receipt printer connection guide",
    slug: "receipt-printer-connection-guide",
    excerpt: "A researched guide to common receipt-printer connections.",
    content: "## Connection types\n\nVerify the interface before setup.",
    category: "Receipt & Label Printing",
    article_type: "compatibility_guide",
    tags: ["receipt printers", "compatibility"],
    sources: [
      {
        title: "Manufacturer documentation",
        url: "https://example.com/documentation",
      },
    ],
    ...overrides,
  };
}

test("draft ingestion accepts only the configured bearer token", async () => {
  const { hasValidCodexDraftToken, isCodexDraftIngestConfigured } =
    await loadDraftIngestUtilities();
  const previous = process.env.CODEX_DRAFT_INGEST_TOKEN;
  process.env.CODEX_DRAFT_INGEST_TOKEN = "a".repeat(64);

  try {
    assert.equal(isCodexDraftIngestConfigured(), true);
    assert.equal(
      hasValidCodexDraftToken(
        new Request("https://devicefield.com/api/internal/codex/drafts", {
          headers: { Authorization: `Bearer ${"a".repeat(64)}` },
        }),
      ),
      true,
    );
    assert.equal(
      hasValidCodexDraftToken(
        new Request("https://devicefield.com/api/internal/codex/drafts", {
          headers: { Authorization: `Bearer ${"b".repeat(64)}` },
        }),
      ),
      false,
    );
  } finally {
    if (previous === undefined) delete process.env.CODEX_DRAFT_INGEST_TOKEN;
    else process.env.CODEX_DRAFT_INGEST_TOKEN = previous;
  }
});

test("draft ingestion normalizes valid packages as researched drafts", async () => {
  const { validateCodexDraftPayload } = await loadDraftIngestUtilities();
  const result = validateCodexDraftPayload({ article: validDraft() });

  assert.equal(result.ok, true);
  assert.equal(result.article.slug, "receipt-printer-connection-guide");
  assert.equal(result.article.testing_status, "researched");
  assert.deepEqual(result.article.original_evidence, []);
  assert.equal(result.article.sources[0].url, "https://example.com/documentation");
  assert.equal("workflow_status" in result.article, false);
});

test("draft ingestion rejects editorial and unsupported trust claims", async () => {
  const { validateCodexDraftPayload } = await loadDraftIngestUtilities();
  const invalidPackages = [
    validDraft({ workflow_status: "published" }),
    validDraft({ testing_status: "tested" }),
    validDraft({ original_evidence: [{ label: "Hands-on test" }] }),
    validDraft({ category: "AI Tools" }),
    validDraft({ sources: [{ title: "Missing URL" }] }),
  ];

  for (const article of invalidPackages) {
    assert.equal(validateCodexDraftPayload(article).ok, false);
  }
});
