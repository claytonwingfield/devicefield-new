import { createClient } from "@supabase/supabase-js";
import type { AffiliateLink, AffiliateLinkWithProgram, AffiliateProgram } from "./types";

type AffiliateProgramSummary = Pick<
  AffiliateProgram,
  "id" | "name" | "network" | "status"
>;

type AffiliateLinkQueryRow = AffiliateLink & {
  affiliate_programs?: AffiliateProgramSummary | AffiliateProgramSummary[] | null;
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

export async function getAffiliateLinkBySlug(slug: string) {
  const supabase = createPublicAffiliateClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("affiliate_links")
    .select(
      "id,slug,label,program_id,destination_url,use_redirect,active,disclosure_required,rel,created_at,updated_at,affiliate_programs(id,name,network,status)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as AffiliateLinkQueryRow;
  const affiliateProgram = Array.isArray(row.affiliate_programs)
    ? row.affiliate_programs[0] ?? null
    : row.affiliate_programs ?? null;

  return {
    ...row,
    affiliate_programs: affiliateProgram,
  } satisfies AffiliateLinkWithProgram;
}

export function getAffiliateHref(
  link: Pick<AffiliateLinkWithProgram, "slug" | "destination_url" | "use_redirect">,
) {
  return link.use_redirect ? `/go/${link.slug}` : link.destination_url;
}
