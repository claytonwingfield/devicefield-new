const ingestUrl = process.env.CODEX_DRAFT_INGEST_URL;
const ingestToken =
  process.env.DEVICEFIELD_INGEST_AUTH ??
  process.env.CODEX_DRAFT_INGEST_TOKEN;

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function main() {
  if (!ingestUrl || !ingestToken || ingestToken.length < 32) {
    throw new Error(
      "Missing CODEX_DRAFT_INGEST_URL or Devicefield ingest authorization.",
    );
  }

  const base = new URL(ingestUrl);
  const endpoint = new URL("/api/internal/codex/newsletters", base.origin);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${ingestToken}`,
    },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(result) && typeof result.error === "string"
        ? result.error
        : `Newsletter inventory request failed (${response.status}).`,
    );
  }
  if (
    !isRecord(result) ||
    !Array.isArray(result.campaigns) ||
    !Array.isArray(result.articles) ||
    !Array.isArray(result.affiliate_links)
  ) {
    throw new Error("Newsletter inventory returned an invalid response.");
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Newsletter inventory failed.",
  );
  process.exitCode = 1;
});
