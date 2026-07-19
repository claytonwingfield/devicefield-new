import { getSiteOrigin } from "@/lib/site-origin";

const RESEND_API_URL = "https://api.resend.com";

function getProviderConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  const siteUrl = getSiteOrigin();

  return apiKey && from ? { apiKey, from, siteUrl } : null;
}

function getBroadcastConfig() {
  const config = getProviderConfig();
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  return config && segmentId ? { ...config, segmentId } : null;
}

export function isNewsletterProviderConfigured() {
  return getProviderConfig() !== null;
}

export function isNewsletterBroadcastConfigured() {
  return getBroadcastConfig() !== null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function resendRequest(path: string, init: RequestInit, apiKey: string) {
  return fetch(`${RESEND_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
}

export async function sendNewsletterConfirmation(input: {
  email: string;
  confirmationToken: string;
}) {
  const config = getProviderConfig();
  if (!config) return false;

  const confirmationUrl = `${config.siteUrl}/newsletter/confirm?token=${encodeURIComponent(input.confirmationToken)}`;
  const response = await resendRequest(
    "/emails",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": `newsletter-confirm-${input.confirmationToken.slice(0, 32)}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.email],
        subject: "Confirm your Devicefield subscription",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b"><p style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#4d7c0f">Devicefield</p><h1 style="font-size:30px;line-height:1.2">Confirm your subscription</h1><p style="font-size:16px;line-height:1.7">Confirm that you want Devicefield buying guides, troubleshooting notes, and business technology updates.</p><p style="margin:28px 0"><a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;border-radius:999px;background:#18181b;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700">Confirm subscription</a></p><p style="font-size:13px;line-height:1.6;color:#71717a">This link expires in 7 days. If you did not request this email, you can ignore it.</p></div>`,
        text: `Confirm your Devicefield subscription: ${confirmationUrl}\n\nThis link expires in 7 days. If you did not request this email, ignore it.`,
        tags: [{ name: "category", value: "newsletter_confirmation" }],
      }),
    },
    config.apiKey,
  );

  if (!response.ok) {
    console.warn("Resend confirmation email failed:", response.status);
  }
  return response.ok;
}

export async function sendNewsletterWelcome(input: {
  email: string;
  unsubscribeToken: string;
}) {
  const config = getProviderConfig();
  if (!config) return false;

  const unsubscribeUrl = `${config.siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;
  const response = await resendRequest(
    "/emails",
    {
      method: "POST",
      body: JSON.stringify({
        from: config.from,
        to: [input.email],
        subject: "Your Devicefield subscription is confirmed",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#18181b"><p style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#4d7c0f">Devicefield</p><h1 style="font-size:30px;line-height:1.2">Subscription confirmed</h1><p style="font-size:16px;line-height:1.7">You will receive new buying guides, corrections, and practical business technology notes when they publish.</p><p style="font-size:13px;line-height:1.6;color:#71717a">You can <a href="${escapeHtml(unsubscribeUrl)}">unsubscribe at any time</a>.</p></div>`,
        text: `Your Devicefield subscription is confirmed.\n\nUnsubscribe at any time: ${unsubscribeUrl}`,
        tags: [{ name: "category", value: "newsletter_welcome" }],
      }),
    },
    config.apiKey,
  );

  return response.ok;
}

export async function syncNewsletterContact(
  email: string,
  unsubscribed: boolean,
) {
  const config = getProviderConfig();
  if (!config) return null;
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;

  let response = await resendRequest(
    "/contacts",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        unsubscribed,
        ...(!unsubscribed && segmentId
          ? { segments: [{ id: segmentId }] }
          : {}),
      }),
    },
    config.apiKey,
  );

  if (response.status === 409) {
    response = await resendRequest(
      `/contacts/${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ unsubscribed }),
      },
      config.apiKey,
    );
  }

  if (!response.ok) {
    console.warn("Resend contact synchronization failed:", response.status);
    return null;
  }

  const data = (await response.json()) as { id?: string };
  if (!unsubscribed && segmentId) {
    const segmentResponse = await resendRequest(
      `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "POST" },
      config.apiKey,
    );
    if (!segmentResponse.ok && segmentResponse.status !== 409) {
      console.warn(
        "Resend newsletter segment synchronization failed:",
        segmentResponse.status,
      );
      return null;
    }
  }

  return data.id ?? null;
}

export async function scheduleNewsletterBroadcast(input: {
  name: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  scheduledAt: string;
}) {
  const config = getBroadcastConfig();
  if (!config) return null;

  const response = await resendRequest(
    "/broadcasts",
    {
      method: "POST",
      body: JSON.stringify({
        segment_id: config.segmentId,
        from: config.from,
        reply_to: "contact@devicefield.com",
        name: input.name,
        subject: input.subject,
        preview_text: input.preheader,
        html: input.html,
        text: input.text,
        send: true,
        scheduled_at: input.scheduledAt,
      }),
    },
    config.apiKey,
  );

  if (!response.ok) {
    console.warn("Resend broadcast scheduling failed:", response.status);
    return null;
  }

  const result = (await response.json()) as { id?: string };
  return result.id ?? null;
}
