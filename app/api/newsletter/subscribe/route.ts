import { NextResponse, type NextRequest } from "next/server";
import {
  isNewsletterProviderConfigured,
  sendNewsletterConfirmation,
} from "@/lib/newsletter/provider";
import {
  createConfirmationToken,
  hashNewsletterValue,
  hashNewsletterVisitor,
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  requestNewsletterSubscription,
} from "@/lib/newsletter/server";
import { hasAllowedRequestOrigin } from "@/lib/site-origin";

type SubscriptionBody = {
  email?: unknown;
  source?: unknown;
  company?: unknown;
};

function json(message: string, status = 200) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function getVisitorFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const address =
    forwardedFor?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("fastly-client-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return hashNewsletterVisitor(`${address}|${userAgent}`);
}

export async function POST(request: NextRequest) {
  if (!hasAllowedRequestOrigin(request)) {
    return json("Subscription request rejected.", 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 5_000) {
    return json("Subscription request rejected.", 413);
  }

  let body: SubscriptionBody;
  try {
    body = (await request.json()) as SubscriptionBody;
  } catch {
    return json("Enter a valid email address.", 400);
  }

  if (typeof body.company === "string" && body.company.trim().length > 0) {
    return json("Check your inbox to confirm your subscription.");
  }

  const email =
    typeof body.email === "string" ? normalizeNewsletterEmail(body.email) : "";
  if (!isValidNewsletterEmail(email)) {
    return json("Enter a valid email address.", 400);
  }

  if (!isNewsletterProviderConfigured()) {
    return json("Email confirmation is temporarily unavailable.", 503);
  }

  const visitorHash = getVisitorFingerprint(request);
  if (!visitorHash) {
    return json("Email confirmation is temporarily unavailable.", 503);
  }

  const confirmationToken = createConfirmationToken();
  const result = await requestNewsletterSubscription({
    email,
    source:
      typeof body.source === "string" ? body.source.slice(0, 200) : "site",
    visitorHash,
    confirmationTokenHash: hashNewsletterValue(confirmationToken),
  });

  if (!result) {
    return json("Could not subscribe right now. Try again shortly.", 503);
  }

  if (result.result === "rate_limited") {
    return json("Too many attempts. Try again in 15 minutes.", 429);
  }

  if (result.result === "invalid") {
    return json("Enter a valid email address.", 400);
  }

  if (result.result === "pending") {
    const sent = await sendNewsletterConfirmation({
      email,
      confirmationToken,
    });
    if (!sent) {
      return json(
        "Could not send the confirmation email. Try again shortly.",
        503,
      );
    }
  }

  return json("Check your inbox to confirm your subscription.");
}
