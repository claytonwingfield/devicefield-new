import { createClient } from "@supabase/supabase-js";

export type SitePageSlug = "home" | "blog" | "terms";

export type SitePage = {
  slug: SitePageSlug;
  title: string;
  meta_description: string;
  content: Record<string, unknown>;
  updated_at?: string;
};

export type TermsSection = {
  title: string;
  body: string;
};

const homeContent = {
  eyebrow: "Independent reviews. Business-first.",
  heading: "Tested devices and systems for modern businesses.",
  intro:
    "Independent buying guides, compatibility notes, reviews, setup guides, and troubleshooting articles for business devices and systems.",
  primaryCta: "Browse Buying Guides",
  secondaryCta: "How we test",
  coverageLabel: "Coverage map",
  focusAreas: [
    "Business devices",
    "SaaS systems",
    "AI workflows",
    "Security tools",
    "Web infrastructure",
    "Operations stack",
  ],
  featuredEyebrow: "Featured",
  featuredHeading: "Practical buying guides",
  affiliateEyebrow: "Research library",
  affiliateHeading: "Built around buyer-intent research, not random link lists.",
  latestEyebrow: "Latest",
  latestHeading: "New from Devicefield",
  disclosureEyebrow: "Disclosure",
  disclosureText:
    "Some articles may include partner links. The goal is to publish useful, test-driven recommendations with clear tradeoffs.",
};

const blogContent = {
  eyebrow: "Field notes",
  heading: "Reviews, comparisons, and operating guides.",
  intro:
    "Clear recommendations for teams choosing devices, SaaS platforms, AI workflows, security tools, and the systems that connect them.",
};

const termsContent = {
  eyebrow: "Policy",
  heading: "Terms, disclosure, and editorial standards.",
  intro:
    "Devicefield is an independent publication focused on devices, software, and systems for modern businesses.",
  sections: [
    {
      title: "Affiliate disclosure",
      body: "Devicefield may earn commissions when readers click affiliate links and purchase products or services. Those commissions help fund testing, writing, hosting, and maintenance. Affiliate compensation does not guarantee coverage, placement, or a positive recommendation.",
    },
    {
      title: "Editorial policy",
      body: "Recommendations should be based on product fit, testing notes, implementation tradeoffs, pricing context, security considerations, and realistic alternatives. Devicefield aims to explain who a product is best for and who should avoid it.",
    },
    {
      title: "No professional advice",
      body: "Devicefield content is for general informational purposes. It is not legal, financial, procurement, security, or technical consulting advice. Businesses should evaluate products against their own requirements before buying.",
    },
    {
      title: "Accuracy and changes",
      body: "Pricing, product features, affiliate terms, and availability can change. Devicefield may update articles over time, but readers should verify important details with the vendor before making a purchase.",
    },
    {
      title: "Website use",
      body: "By using this website, you agree not to misuse the site, attempt unauthorized access, copy content at scale, or interfere with normal operation. Devicefield may update these terms as the site evolves.",
    },
  ],
};

export const defaultSitePages: Record<SitePageSlug, SitePage> = {
  home: {
    slug: "home",
    title: "Devicefield - Tested devices and systems for modern businesses",
    meta_description:
      "Independent buying guides, product reviews, comparisons, setup guides, and troubleshooting articles for business devices and systems.",
    content: homeContent,
  },
  blog: {
    slug: "blog",
    title: "Business Device and Systems Guides - Devicefield",
    meta_description:
      "Browse Devicefield buying guides, business system reviews, security checklists, and implementation playbooks.",
    content: blogContent,
  },
  terms: {
    slug: "terms",
    title: "Terms, Affiliate Disclosure, and Editorial Policy - Devicefield",
    meta_description:
      "Read Devicefield's affiliate disclosure, editorial policy, and website terms.",
    content: termsContent,
  },
};

function createPublicSiteClient() {
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

function normalizePage(page: Partial<SitePage>, slug: SitePageSlug): SitePage {
  const fallback = defaultSitePages[slug];

  return {
    slug,
    title: page.title || fallback.title,
    meta_description: page.meta_description || fallback.meta_description,
    content:
      page.content && typeof page.content === "object"
        ? { ...fallback.content, ...page.content }
        : fallback.content,
    updated_at: page.updated_at,
  };
}

export async function getSitePage(slug: SitePageSlug) {
  const supabase = createPublicSiteClient();
  if (!supabase) return defaultSitePages[slug];

  const { data, error } = await supabase
    .from("site_pages")
    .select("slug,title,meta_description,content,updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return defaultSitePages[slug];

  return normalizePage(data as Partial<SitePage>, slug);
}

export function getString(
  content: Record<string, unknown>,
  key: string,
  fallback: string,
) {
  const value = content[key];
  return typeof value === "string" ? value : fallback;
}

export function getStringArray(
  content: Record<string, unknown>,
  key: string,
  fallback: string[],
) {
  const value = content[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : fallback;
}

export function getTermsSections(content: Record<string, unknown>) {
  const value = content.sections;
  if (!Array.isArray(value)) return termsContent.sections;

  const sections = value.filter(
    (section): section is TermsSection =>
      typeof section === "object" &&
      section !== null &&
      typeof (section as TermsSection).title === "string" &&
      typeof (section as TermsSection).body === "string",
  );

  return sections.length > 0 ? sections : termsContent.sections;
}
