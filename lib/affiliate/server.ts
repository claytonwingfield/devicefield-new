import { createClient } from "@supabase/supabase-js";
import type {
  AffiliateLink,
  AffiliateLinkWithProgram,
  AffiliateProgram,
  ArticleProduct,
  ArticleProductWithLink,
} from "./types";

type AffiliateProgramSummary = Pick<
  AffiliateProgram,
  "id" | "name" | "network" | "status"
>;

type AffiliateLinkQueryRow = AffiliateLink & {
  affiliate_programs?:
    | AffiliateProgramSummary
    | AffiliateProgramSummary[]
    | null;
};

type ArticleProductQueryRow = ArticleProduct & {
  affiliate_links?: AffiliateLinkQueryRow | AffiliateLinkQueryRow[] | null;
};

function createPublicAffiliateClient() {
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

function createServerAffiliateClient() {
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

function normalizeAffiliateLink(row: AffiliateLinkQueryRow) {
  const affiliateProgram = Array.isArray(row.affiliate_programs)
    ? (row.affiliate_programs[0] ?? null)
    : (row.affiliate_programs ?? null);

  return {
    ...row,
    affiliate_programs: affiliateProgram,
  } satisfies AffiliateLinkWithProgram;
}

export async function getAffiliateLinkBySlug(slug: string) {
  const supabase = createPublicAffiliateClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("affiliate_links")
    .select(
      "id,slug,label,program_id,destination_url,use_redirect,active,disclosure_required,rel,created_at,updated_at,affiliate_programs(id,name,network,status)",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  const link = normalizeAffiliateLink(data as unknown as AffiliateLinkQueryRow);
  return link.affiliate_programs?.status === "approved" ? link : null;
}

export async function getArticleProducts(articleId: string) {
  const supabase = createPublicAffiliateClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("article_products")
    .select(
      "id,article_id,affiliate_link_id,product_name,award,best_for,avoid_if,verdict,pros,cons,placement,display_order,created_at,updated_at,affiliate_links(id,slug,label,program_id,destination_url,use_redirect,active,disclosure_required,rel,created_at,updated_at,affiliate_programs(id,name,network,status))",
    )
    .eq("article_id", articleId)
    .order("display_order", { ascending: true });

  if (error) {
    console.warn(
      "Unable to load article products from Supabase:",
      error.message,
    );
    return [];
  }

  return ((data ?? []) as unknown as ArticleProductQueryRow[]).flatMap(
    (row) => {
      const affiliateLink = Array.isArray(row.affiliate_links)
        ? (row.affiliate_links[0] ?? null)
        : (row.affiliate_links ?? null);

      const normalizedLink = affiliateLink
        ? normalizeAffiliateLink(affiliateLink)
        : null;
      if (
        !row.affiliate_link_id ||
        !normalizedLink?.active ||
        normalizedLink.affiliate_programs?.status !== "approved"
      ) {
        return [];
      }

      return [
        {
          ...row,
          affiliate_link_id: row.affiliate_link_id,
          affiliate_links: normalizedLink,
        } satisfies ArticleProductWithLink,
      ];
    },
  );
}

export async function recordAffiliateClick(input: {
  affiliateLinkId: string;
  articleId: string | null;
  placement: string | null;
  referrer: string | null;
  visitorHash: string;
  country: string | null;
}) {
  const supabase = createServerAffiliateClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("record_affiliate_click", {
    p_affiliate_link_id: input.affiliateLinkId,
    p_article_id: input.articleId,
    p_cta_placement: input.placement,
    p_referrer: input.referrer,
    p_visitor_hash: input.visitorHash,
    p_country: input.country,
  });

  if (error) {
    console.warn("Unable to record affiliate click:", error.message);
    return false;
  }

  return data === true;
}

export function getAffiliateHref(
  link: Pick<
    AffiliateLinkWithProgram,
    "slug" | "destination_url" | "use_redirect"
  >,
) {
  return link.use_redirect ? `/go/${link.slug}` : link.destination_url;
}
