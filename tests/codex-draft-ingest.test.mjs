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
    cover_images: [1, 2, 3].map((number) => ({
      file_name: `cover-option-${number}.webp`,
      alt:
        number === 1
          ? "Diagram of receipt printer connection options"
          : `Alternative ${number} diagram of receipt printer connections`,
      label: `Concept ${number}`,
    })),
    social_posts: [
      {
        platform: "x",
        content:
          "Compare receipt-printer connection options before deployment. https://devicefield.com/blog/receipt-printer-connection-guide",
      },
      {
        platform: "facebook",
        content:
          "USB, Ethernet, and wireless receipt printers have different setup tradeoffs. This researched guide explains what to verify before choosing one. Read the guide: https://devicefield.com/blog/receipt-printer-connection-guide",
      },
      {
        platform: "instagram",
        content:
          "Choosing a receipt-printer connection affects setup, reliability, and troubleshooting. This researched guide compares the practical tradeoffs before deployment. Link in bio. Reference: https://devicefield.com/blog/receipt-printer-connection-guide #ReceiptPrinter #POSHardware #BusinessTechnology",
      },
    ],
    body_images: [],
    article_products: [],
    affiliate_suggestions: [],
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
  assert.equal(result.article.cover_images.length, 3);
  assert.equal(result.article.social_posts.length, 3);
  assert.equal("workflow_status" in result.article, false);
});

test("draft ingestion requires complete ordered social drafts", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const drafts = validDraft().social_posts;

  assert.equal(
    validateCodexDraftPayload(validDraft({ social_posts: drafts.slice(0, 2) })).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({ social_posts: [drafts[1], drafts[0], drafts[2]] }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        social_posts: drafts.map((draft) =>
          draft.platform === "facebook"
            ? { ...draft, content: "Missing the canonical article URL." }
            : draft,
        ),
      }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        social_posts: drafts.map((draft) =>
          draft.platform === "instagram"
            ? { ...draft, content: draft.content.replace("Link in bio", "Read more") }
            : draft,
        ),
      }),
    ).ok,
    false,
  );
});

test("draft ingestion requires three ordered cover concepts with matching alt text", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );

  assert.equal(
    validateCodexDraftPayload(validDraft({ cover_images: [] })).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        cover_images: validDraft().cover_images.slice(0, 2),
      }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        cover_images: validDraft().cover_images.map((image, index) =>
          index === 1
            ? { ...image, file_name: "cover-option-3.webp" }
            : image,
        ),
      }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({ cover_image_alt: "Alt text that does not match option one" }),
    ).ok,
    false,
  );
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

test("affiliate research and unlinked recommendations normalize for admin review", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const result = validateCodexDraftPayload(
    validDraft({
      article_products: [
        {
          affiliate_link_slug: null,
          product_name: "Example receipt printer",
          award: "Best for fixed counters",
          best_for: "Businesses using a wired checkout",
          avoid_if: "A mobile printer is required",
          verdict: "A researched product candidate for editorial review.",
          pros: ["Documented interface support"],
          cons: ["Not tested by Devicefield"],
          placement: "recommendation",
          display_order: 0,
        },
      ],
      affiliate_suggestions: [
        {
          program_name: "Example partner program",
          network: "direct",
          program_url: "https://example.com/partners",
          product_name: "Example receipt printer",
          evidence_url: "https://example.com/affiliate-program",
          evidence_checked_at: "2026-07-18T12:00:00.000Z",
          rationale: "The merchant carries the product discussed in the guide.",
          target_heading: "Connection types",
          suggested_placement: "after_section",
          insertion_note:
            "Place a product card after the connection comparison once a link is approved.",
          suggested_cta: "Check current pricing",
          display_order: 0,
        },
      ],
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.article.article_products[0].affiliate_link_slug, null);
  assert.equal(
    result.article.affiliate_suggestions[0].target_heading,
    "Connection types",
  );
});

test("affiliate suggestions require valid classifications and an exact article heading", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const baseSuggestion = {
    program_name: "Example partner program",
    network: "direct",
    program_url: "https://example.com/partners",
    product_name: "Example product",
    evidence_url: "https://example.com/evidence",
    evidence_checked_at: "2026-07-18T12:00:00.000Z",
    rationale: "The program covers the article product.",
    target_heading: "Connection types",
    suggested_placement: "within_section",
    insertion_note: "Add after the interface requirements paragraph.",
    suggested_cta: "View current pricing",
    display_order: 0,
  };

  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        affiliate_suggestions: [
          { ...baseSuggestion, target_heading: "Missing section" },
        ],
      }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        affiliate_suggestions: [
          { ...baseSuggestion, network: "unsupported-network" },
        ],
      }),
    ).ok,
    false,
  );
});

test("inline article images require descriptive alt text", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        content:
          "## Connection types\n\n![](https://example.com/diagram.webp)",
      }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        content:
          "## Connection types\n\n![Receipt printer connection diagram](https://example.com/diagram.webp)",
      }),
    ).ok,
    true,
  );
});

test("local body images require a matching manifest, placeholder, and alt text", async () => {
  const { validateCodexDraftPayload } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const content =
    "## Connection types\n\n![Diagram comparing receipt printer connection paths](devicefield-body-image://connection-paths)";
  const bodyImage = {
    id: "connection-paths",
    file_name: "connection-paths.webp",
    alt: "Diagram comparing receipt printer connection paths",
  };

  const valid = validateCodexDraftPayload(
    validDraft({ content, body_images: [bodyImage] }),
  );
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.article.body_images, [bodyImage]);

  assert.equal(
    validateCodexDraftPayload(validDraft({ content, body_images: [] })).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        content: "## Connection types\n\nNo diagram is embedded.",
        body_images: [bodyImage],
      }),
    ).ok,
    false,
  );
  assert.equal(
    validateCodexDraftPayload(
      validDraft({
        content:
          "## Connection types\n\n![Short](devicefield-body-image://connection-paths)",
        body_images: [{ ...bodyImage, alt: "Short" }],
      }),
    ).ok,
    false,
  );
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

test("body image validation accepts useful dimensions and rejects undersized images", async () => {
  const { validateCodexBodyImage } = await loadBundledModule(
    "lib/codex/draft-ingest.ts",
  );
  const validBytes = Uint8Array.from(
    await sharp({
      create: {
        width: 1200,
        height: 675,
        channels: 4,
        background: "#18181b",
      },
    })
      .webp()
      .toBuffer(),
  );
  const smallBytes = Uint8Array.from(
    await sharp({
      create: {
        width: 600,
        height: 300,
        channels: 4,
        background: "#18181b",
      },
    })
      .webp()
      .toBuffer(),
  );

  const valid = await validateCodexBodyImage({
    size: validBytes.length,
    type: "image/webp",
    arrayBuffer: async () => validBytes.buffer,
  });
  assert.equal(valid.ok, true);

  const small = await validateCodexBodyImage({
    size: smallBytes.length,
    type: "image/webp",
    arrayBuffer: async () => smallBytes.buffer,
  });
  assert.equal(small.ok, false);
  assert.match(small.error, /800 x 400/);
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
