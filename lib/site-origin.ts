const FALLBACK_SITE_ORIGIN = "https://devicefield.com";

function parseOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isDevelopmentLocalOrigin(origin: string) {
  if (process.env.NODE_ENV !== "development") return false;

  try {
    const url = new URL(origin);
    return (
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      ["http:", "https:"].includes(url.protocol)
    );
  } catch {
    return false;
  }
}

export function getSiteOrigin() {
  return (
    parseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? FALLBACK_SITE_ORIGIN
  );
}

export function isAllowedSiteOrigin(value: string | null | undefined) {
  const origin = parseOrigin(value);
  if (!origin) return false;
  return origin === getSiteOrigin() || isDevelopmentLocalOrigin(origin);
}

export function hasAllowedRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return isAllowedSiteOrigin(origin);

  const referer = request.headers.get("referer");
  return Boolean(referer && isAllowedSiteOrigin(referer));
}

function getTrustedRequestOrigin(request: Request) {
  const candidates = [
    request.headers.get("origin"),
    request.headers.get("referer"),
    request.url,
  ];

  for (const candidate of candidates) {
    const origin = parseOrigin(candidate);
    if (origin && isAllowedSiteOrigin(origin)) return origin;
  }

  return getSiteOrigin();
}

export function getSameOriginUrl(request: Request, path: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return new URL(safePath, getTrustedRequestOrigin(request));
}
