export const AFFILIATE_NETWORKS = [
  "impact",
  "shareasale",
  "awin",
  "rakuten",
  "amazon",
  "direct",
  "other",
] as const;

export const AFFILIATE_PROGRAM_STATUSES = [
  "not_applied",
  "pending",
  "approved",
  "rejected",
  "paused",
] as const;

export type AffiliateNetwork = (typeof AFFILIATE_NETWORKS)[number];
export type AffiliateProgramStatus =
  (typeof AFFILIATE_PROGRAM_STATUSES)[number];

export type AffiliateProgram = {
  id: string;
  name: string;
  network: AffiliateNetwork;
  status: AffiliateProgramStatus;
  commission_summary: string | null;
  cookie_duration: string | null;
  payout_notes: string | null;
  terms_url: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AffiliateLink = {
  id: string;
  slug: string;
  label: string;
  program_id: string;
  destination_url: string;
  use_redirect: boolean;
  active: boolean;
  disclosure_required: boolean;
  rel: "sponsored nofollow";
  created_at: string;
  updated_at: string;
};

export type AffiliateClickEvent = {
  id: string;
  affiliate_link_id: string;
  article_id: string | null;
  cta_placement: string | null;
  referrer: string | null;
  user_agent_hash: string | null;
  country: string | null;
  created_at: string;
};

export type AffiliateLinkWithProgram = AffiliateLink & {
  affiliate_programs?: Pick<
    AffiliateProgram,
    "id" | "name" | "network" | "status"
  > | null;
};

export const ARTICLE_PRODUCT_PLACEMENTS = [
  "recommendation",
  "comparison",
  "alternative",
] as const;

export type ArticleProductPlacement =
  (typeof ARTICLE_PRODUCT_PLACEMENTS)[number];

export type ArticleProduct = {
  id: string;
  article_id: string;
  affiliate_link_id: string;
  product_name: string;
  award: string | null;
  best_for: string | null;
  avoid_if: string | null;
  verdict: string | null;
  pros: string[];
  cons: string[];
  placement: ArticleProductPlacement;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ArticleProductWithLink = ArticleProduct & {
  affiliate_links: AffiliateLinkWithProgram;
};
