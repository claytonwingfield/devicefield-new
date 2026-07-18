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

export const AFFILIATE_SUGGESTION_PLACEMENTS = [
  "before_section",
  "after_section",
  "within_section",
  "comparison_table",
  "alternatives",
] as const;

export const AFFILIATE_SUGGESTION_REVIEW_STATUSES = [
  "pending",
  "shortlisted",
  "dismissed",
] as const;

export type AffiliateSuggestionPlacement =
  (typeof AFFILIATE_SUGGESTION_PLACEMENTS)[number];
export type AffiliateSuggestionReviewStatus =
  (typeof AFFILIATE_SUGGESTION_REVIEW_STATUSES)[number];

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
  affiliate_link_id: string | null;
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

export type ArticleProductWithLink = Omit<
  ArticleProduct,
  "affiliate_link_id"
> & {
  affiliate_link_id: string;
  affiliate_links: AffiliateLinkWithProgram;
};

export type ArticleAffiliateSuggestion = {
  id: string;
  article_id: string;
  program_name: string;
  network: AffiliateNetwork;
  program_url: string;
  product_name: string | null;
  evidence_url: string;
  evidence_checked_at: string;
  rationale: string;
  target_heading: string;
  suggested_placement: AffiliateSuggestionPlacement;
  insertion_note: string;
  suggested_cta: string | null;
  review_status: AffiliateSuggestionReviewStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
};
