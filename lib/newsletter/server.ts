import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

export type NewsletterRequestResult =
  | "pending"
  | "already_subscribed"
  | "rate_limited"
  | "invalid";

type ConfirmationRow = {
  subscriber_id: string;
  subscriber_email: string;
  token_version: number;
};

function getNewsletterSecret() {
  return (
    process.env.NEWSLETTER_TOKEN_SECRET ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    null
  );
}

function createNewsletterClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecret) return null;

  return createClient(supabaseUrl, supabaseSecret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function normalizeNewsletterEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidNewsletterEmail(value: string) {
  return (
    value.length <= 320 &&
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
  );
}

export function createConfirmationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashNewsletterValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashNewsletterVisitor(value: string) {
  const secret = getNewsletterSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createUnsubscribeToken(subscriberId: string, version: number) {
  const secret = getNewsletterSecret();
  if (!secret) return null;

  const payload = Buffer.from(`${subscriberId}:${version}`).toString(
    "base64url",
  );
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string) {
  const secret = getNewsletterSecret();
  const [payload, signature, extra] = token.split(".");
  if (!secret || !payload || !signature || extra) return null;

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [subscriberId, versionValue, extraValue] = decoded.split(":");
    const version = Number.parseInt(versionValue, 10);
    if (
      extraValue ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        subscriberId,
      ) ||
      !Number.isInteger(version) ||
      version < 1
    ) {
      return null;
    }

    return { subscriberId, version };
  } catch {
    return null;
  }
}

export async function requestNewsletterSubscription(input: {
  email: string;
  source: string;
  visitorHash: string;
  confirmationTokenHash: string;
}) {
  const supabase = createNewsletterClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc(
    "request_newsletter_subscription",
    {
      p_email: input.email,
      p_source: input.source,
      p_visitor_hash: input.visitorHash,
      p_email_hash: hashNewsletterValue(input.email),
      p_confirmation_token_hash: input.confirmationTokenHash,
    },
  );

  if (error) {
    console.warn("Newsletter subscription request failed:", error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.result !== "string") return null;

  return {
    result: row.result as NewsletterRequestResult,
    subscriberId:
      typeof row.subscriber_id === "string" ? row.subscriber_id : null,
  };
}

export async function confirmNewsletterSubscription(tokenHash: string) {
  const supabase = createNewsletterClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc(
    "confirm_newsletter_subscription",
    { p_confirmation_token_hash: tokenHash },
  );

  if (error) {
    console.warn("Newsletter confirmation failed:", error.message);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConfirmationRow | null;
  return row?.subscriber_id ? row : null;
}

export async function unsubscribeNewsletter(input: {
  subscriberId: string;
  version: number;
}) {
  const supabase = createNewsletterClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("unsubscribe_newsletter", {
    p_subscriber_id: input.subscriberId,
    p_token_version: input.version,
  });

  if (error) {
    console.warn("Newsletter unsubscribe failed:", error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row.subscriber_email === "string"
    ? row.subscriber_email
    : null;
}

export async function markNewsletterProviderSync(input: {
  subscriberId: string;
  providerContactId?: string | null;
}) {
  const supabase = createNewsletterClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({
      provider_contact_id: input.providerContactId ?? null,
      provider_synced_at: new Date().toISOString(),
    })
    .eq("id", input.subscriberId);

  if (error) {
    console.warn("Newsletter provider sync marker failed:", error.message);
    return false;
  }

  return true;
}
