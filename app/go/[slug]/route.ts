import { createHmac } from "crypto";
import { notFound } from "next/navigation";
import { after, NextResponse, type NextRequest } from "next/server";
import {
  getAffiliateLinkBySlug,
  recordAffiliateClick,
} from "@/lib/affiliate/server";

type GoRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

const BOT_USER_AGENT =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|preview|uptime|monitor/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function shouldTrack(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");
  const purpose = `${request.headers.get("purpose") ?? ""} ${request.headers.get("sec-purpose") ?? ""}`;

  return Boolean(
    userAgent &&
    !BOT_USER_AGENT.test(userAgent) &&
    !purpose.toLowerCase().includes("prefetch"),
  );
}

function getVisitorHash(request: NextRequest) {
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userAgent = request.headers.get("user-agent");
  if (!secret || !userAgent) return null;

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const address =
    forwardedFor?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("fastly-client-ip") ??
    "unknown";

  return createHmac("sha256", secret)
    .update(`${address}|${userAgent}`)
    .digest("hex");
}

function getCountry(request: NextRequest) {
  return (
    request.headers.get("x-country-code") ??
    request.headers.get("x-appengine-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country")
  );
}

export async function GET(request: NextRequest, { params }: GoRouteProps) {
  const { slug } = await params;
  const link = await getAffiliateLinkBySlug(slug);

  if (!link || !link.active || !link.use_redirect) {
    notFound();
  }

  const searchParams = request.nextUrl.searchParams;
  const visitorHash = getVisitorHash(request);
  if (visitorHash && shouldTrack(request)) {
    const requestedArticleId = searchParams.get("articleId");
    after(async () => {
      try {
        await recordAffiliateClick({
          affiliateLinkId: link.id,
          articleId:
            requestedArticleId && UUID_PATTERN.test(requestedArticleId)
              ? requestedArticleId
              : null,
          placement: searchParams.get("placement"),
          referrer: request.headers.get("referer"),
          visitorHash,
          country: getCountry(request),
        });
      } catch (error) {
        console.warn("Affiliate click analytics failed:", error);
      }
    });
  }

  return NextResponse.redirect(link.destination_url, 307);
}
