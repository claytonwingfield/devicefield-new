const ingestUrl = process.env.CODEX_DRAFT_INGEST_URL;
const ingestToken =
  process.env.DEVICEFIELD_INGEST_AUTH ?? process.env.CODEX_DRAFT_INGEST_TOKEN;

const ALLOWED_ARTICLE_FIELDS = new Set([
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
]);
const ALLOWED_AFFILIATE_LINK_FIELDS = new Set([
  "slug",
  "label",
  "program_name",
  "network",
]);

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isSafeInventoryItem(value) {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => !ALLOWED_ARTICLE_FIELDS.has(key))) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.slug === "string" &&
    (typeof value.focus_keyword === "string" || value.focus_keyword === null) &&
    typeof value.category === "string" &&
    typeof value.article_type === "string" &&
    typeof value.testing_status === "string" &&
    typeof value.workflow_status === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    typeof value.updated_at === "string"
  );
}

function isSafeAffiliateLink(value) {
  if (!isRecord(value)) return false;
  if (
    Object.keys(value).some(
      (key) => !ALLOWED_AFFILIATE_LINK_FIELDS.has(key),
    )
  ) {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.label === "string" &&
    typeof value.program_name === "string" &&
    typeof value.network === "string"
  );
}

async function main() {
  if (!ingestUrl || !ingestToken) {
    throw new Error(
      "Missing CODEX_DRAFT_INGEST_URL or Devicefield ingest authorization.",
    );
  }

  if (ingestToken.length < 32) {
    throw new Error(
      "Devicefield ingest authorization is not configured correctly.",
    );
  }

  const draftEndpoint = new URL(ingestUrl);
  if (
    draftEndpoint.protocol !== "https:" &&
    !(
      draftEndpoint.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(draftEndpoint.hostname)
    )
  ) {
    throw new Error("CODEX_DRAFT_INGEST_URL must use HTTPS.");
  }

  const inventoryEndpoint = new URL(
    "/api/internal/codex/articles",
    draftEndpoint.origin,
  );
  let response;
  try {
    response = await fetch(inventoryEndpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${ingestToken}`,
      },
    });
  } catch {
    throw new Error("Article inventory endpoint could not be reached.");
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(result) && typeof result.error === "string"
        ? result.error
        : `Article inventory request failed (${response.status}).`,
    );
  }
  if (
    !isRecord(result) ||
    !Array.isArray(result.articles) ||
    !result.articles.every(isSafeInventoryItem) ||
    !Array.isArray(result.affiliate_links) ||
    !result.affiliate_links.every(isSafeAffiliateLink)
  ) {
    throw new Error("Article inventory endpoint returned an invalid response.");
  }

  console.log(
    JSON.stringify(
      {
        articles: result.articles,
        affiliate_links: result.affiliate_links,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Article inventory request failed.",
  );
  process.exitCode = 1;
});
