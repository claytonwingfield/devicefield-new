import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const root = new URL("../", import.meta.url);

async function loadBundledModule(path) {
  const result = await build({
    entryPoints: [new URL(path, root).pathname],
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
    tags: ["receipt printers", "compatibility"],
    cover_image_alt: "Diagram of receipt printer connection options",
    focus_keyword: "receipt printer connections",
    seo_title: "Receipt Printer Connection Guide",
    meta_description:
      "Compare USB, Ethernet, and wireless receipt printer connections for a business setup.",
    canonical_url:
      "https://devicefield.com/blog/receipt-printer-connection-guide",
    faq_items: [],
    article_type: "compatibility_guide",
    testing_status: "researched",
    author_slug: "clayton-wingfield",
    reviewer_slug: "clayton-wingfield",
    last_verified_at: "2026-07-17T12:00:00.000Z",
    next_review_at: "2027-07-17T12:00:00.000Z",
    sources: [1, 2, 3].map((number) => ({
      title: `Manufacturer documentation ${number}`,
      url: `https://example.com/documentation-${number}`,
      note: "Connection specification",
    })),
    claims: [
      {
        claim: "Connection support varies by printer model.",
        source_url: "https://example.com/documentation-1",
        risk: "medium",
        resolved: true,
      },
    ],
    quick_verdict: {
      verdict: "Match the printer interface to the POS host before purchase.",
      best_for: "Operators planning a documented deployment",
      avoid_if: "The printer interface cannot be verified",
    },
    compatibility_notes: "Confirm the host port, driver, and network mode.",
    limitations: "No hands-on connection testing was performed.",
    testing_method: "Specifications were compared across primary documentation.",
    original_evidence: [],
    internal_notes: "Review source currency before approval.",
    featured: false,
    article_products: [],
    ...overrides,
  };
}

test("draft ingestion rejects missing and incorrect bearer tokens", async () => {
  const utilities = await loadBundledModule("lib/codex/draft-ingest.ts");
  const previous = process.env.CODEX_DRAFT_INGEST_TOKEN;
  process.env.CODEX_DRAFT_INGEST_TOKEN = "a".repeat(64);
  try {
    const url = "https://devicefield.com/api/internal/codex/drafts";
    assert.equal(utilities.hasValidCodexDraftToken(new Request(url)), false);
    assert.equal(
      utilities.hasValidCodexDraftToken(
        new Request(url, {
          headers: { Authorization: `Bearer ${"b".repeat(64)}` },
        }),
      ),
      false,
    );
    assert.equal(
      utilities.hasValidCodexDraftToken(
        new Request(url, {
          headers: { Authorization: `Bearer ${"a".repeat(64)}` },
        }),
      ),
      true,
    );
  } finally {
    if (previous === undefined) delete process.env.CODEX_DRAFT_INGEST_TOKEN;
    else process.env.CODEX_DRAFT_INGEST_TOKEN = previous;
  }
});

test("valid article packages normalize without workflow authority", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const result = validateCodexDraftPayload(validDraft());
  assert.equal(result.ok, true);
  assert.equal(result.article.testing_status, "researched");
  assert.equal(result.article.featured, false);
  assert.equal("workflow_status" in result.article, false);
});

test("workflow states and featured placement cannot be requested", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  for (const workflowStatus of ["published", "approved", "scheduled"]) {
    assert.equal(
      validateCodexDraftPayload(
        validDraft({ workflow_status: workflowStatus }),
      ).ok,
      false,
    );
  }
  assert.equal(validateCodexDraftPayload(validDraft({ featured: true })).ok, false);
});

test("invalid categories, placeholders, unsupported testing claims, and high-risk claims are rejected", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const invalidPackages = [
    ["category", validDraft({ category: "AI Tools" })],
    ["placeholder", validDraft({ content: "## Setup\n\nTODO: finish this section." })],
    ["testing status", validDraft({ testing_status: "tested", original_evidence: [] })],
    [
      "high-risk claim",
      validDraft({
        claims: [
          {
            claim: "A high-risk compatibility claim.",
            source_url: "https://example.com/claim",
            risk: "high",
            resolved: false,
          },
        ],
      }),
    ],
  ];
  for (const [label, article] of invalidPackages) {
    assert.equal(validateCodexDraftPayload(article).ok, false, label);
  }
});

test("image validation accepts structurally valid 1600 x 800 PNG and WebP files", async () => {
  const { validateCodexFeaturedImage } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const image = sharp({
    create: {
      width: 1600,
      height: 800,
      channels: 4,
      background: "#18181b",
    },
  });
  const files = [
    ["image/png", "png", await image.clone().png().toBuffer()],
    ["image/webp", "webp", await image.clone().webp().toBuffer()],
  ];

  for (const [type, extension, buffer] of files) {
    const bytes = Uint8Array.from(buffer);
    const result = await validateCodexFeaturedImage({
      size: bytes.length,
      type,
      arrayBuffer: async () => bytes.buffer,
    });
    assert.equal(result.ok, true, type);
    assert.equal(result.width, 1600);
    assert.equal(result.height, 800);
    assert.equal(result.contentType, type);
    assert.equal(result.extension, extension);
  }
});

test("image validation rejects malformed and incorrectly sized files", async () => {
  const { validateCodexFeaturedImage } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const wrongSize = Uint8Array.from(
    await sharp({
      create: {
        width: 800,
        height: 400,
        channels: 4,
        background: "#18181b",
      },
    })
      .png()
      .toBuffer(),
  );
  const malformed = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const wrongSizeResult = await validateCodexFeaturedImage({
    size: wrongSize.length,
    type: "image/png",
    arrayBuffer: async () => wrongSize.buffer,
  });
  assert.equal(wrongSizeResult.ok, false);
  assert.match(wrongSizeResult.error, /1600 x 800/);

  const malformedResult = await validateCodexFeaturedImage({
    size: malformed.length,
    type: "image/png",
    arrayBuffer: async () => malformed.buffer,
  });
  assert.equal(malformedResult.ok, false);
  assert.match(malformedResult.error, /invalid/);
});

test("rate limiting applies to both token and request fingerprint", async () => {
  const utilities = await loadBundledModule("lib/codex/draft-ingest.ts");
  utilities.resetCodexDraftRateLimitForTests();
  const request = new Request(
    "https://devicefield.com/api/internal/codex/drafts",
    {
      headers: {
        Authorization: "Bearer test-token",
        "User-Agent": "devicefield-test-agent",
        "X-Forwarded-For": "192.0.2.10",
      },
    },
  );
  for (let index = 0; index < utilities.CODEX_DRAFT_RATE_LIMIT; index += 1) {
    assert.equal(utilities.consumeCodexDraftRateLimit(request, 1_000), true);
  }
  assert.equal(utilities.consumeCodexDraftRateLimit(request, 1_000), false);
});

test("uploaded images are removed when database insertion fails", async () => {
  const { withUploadedImageCleanup } = await loadBundledModule(
    "lib/codex/upload-cleanup.ts",
  );
  let uploaded = false;
  let cleaned = false;
  await assert.rejects(
    withUploadedImageCleanup({
      upload: async () => {
        uploaded = true;
      },
      operation: async () => {
        throw new Error("database failure");
      },
      cleanup: async () => {
        cleaned = true;
      },
    }),
    /database failure/,
  );
  assert.equal(uploaded, true);
  assert.equal(cleaned, true);
});
