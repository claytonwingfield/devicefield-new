import { createHash } from "crypto";
import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAffiliateLinkBySlug } from "@/lib/affiliate/server";

type GoRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function createClickClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function hashUserAgent(value: string | null) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

function getCountry(request: NextRequest) {
  return (
    request.headers.get("x-country-code") ??
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
  const supabase = createClickClient();
  if (supabase) {
    await supabase.from("affiliate_click_events").insert({
      affiliate_link_id: link.id,
      article_id: searchParams.get("articleId") || null,
      cta_placement: searchParams.get("placement") || null,
      referrer: request.headers.get("referer"),
      user_agent_hash: hashUserAgent(request.headers.get("user-agent")),
      country: getCountry(request),
    });
  }

  return NextResponse.redirect(link.destination_url, 307);
}

