import { createClient } from "@supabase/supabase-js";
import { SITE_SOCIAL_PROFILES } from "@/lib/site/identity";

export type SitePageSlug =
  | "global"
  | "home"
  | "blog"
  | "search"
  | "about"
  | "contact"
  | "review-methodology"
  | "editorial-policy"
  | "affiliate-disclosure"
  | "terms"
  | "privacy";

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

export type HeroEvaluationItem = {
  title: string;
  description: string;
};

export type HomeCategoryEntry = {
  title: string;
  description: string;
};

export type NavigationEntry = {
  href: string;
  label: string;
};

const globalContent = {
  newsletterLabel: "Newsletter",
  navItems: [
    { href: "/blog", label: "Guides" },
    { href: "/blog?type=reviews", label: "Reviews" },
    { href: "/blog?type=comparisons", label: "Comparisons" },
    { href: "/category/troubleshooting", label: "Troubleshooting" },
    { href: "/about", label: "About" },
  ] satisfies NavigationEntry[],
  footerPublicationLinks: [
    { href: "/blog", label: "All guides" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/review-methodology", label: "Review methodology" },
    { href: "/editorial-policy", label: "Editorial policy" },
  ] satisfies NavigationEntry[],
  footerPolicyLinks: [
    { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
  ] satisfies NavigationEntry[],
  footerDescription:
    "Devicefield publishes independent buying guides, reviews, compatibility notes, and troubleshooting help for business devices and systems.",
  footerDisclosure:
    "Devicefield may earn commissions from qualifying purchases made through clearly identified partner links.",
  footerTagline: "Tested devices and systems for modern businesses.",
  footerNewsletterHeading: "Newsletter",
  footerNewsletterText:
    "Get new buying guides, corrections, and practical business technology notes when they publish.",
  socialProfiles: SITE_SOCIAL_PROFILES satisfies NavigationEntry[],
};

const homeContent = {
  eyebrow: "Independent reviews. Business-first.",
  heading: "Tested devices and systems for modern businesses.",
  intro:
    "Independent buying guides, compatibility notes, reviews, setup guides, and troubleshooting articles for business devices and systems.",
  primaryCta: "Browse Buying Guides",
  secondaryCta: "How we evaluate",
  trustStrip: [
    "Hands-on when stated",
    "Specs independently verified",
    "Affiliate-supported",
    "Corrections welcomed",
    "Updated regularly",
  ],
  categoryEyebrow: "Coverage",
  categoryHeading: "Business technology categories Devicefield covers.",
  categoryIntro:
    "Focused guides for the hardware, software, and reliability problems businesses run into every day.",
  categoryEntries: [
    {
      title: "Barcode & Inventory",
      description:
        "Scanners, inventory workflows, SKU labeling, and stock-counting systems.",
    },
    {
      title: "Receipt & Label Printing",
      description:
        "Receipt printers, label printers, thermal media, drivers, and replacement planning.",
    },
    {
      title: "POS Hardware",
      description:
        "Terminals, tablets, cash drawers, stands, card readers, and retail counter setups.",
    },
    {
      title: "Networking & Uptime",
      description:
        "Routers, failover, backup power, Wi-Fi coverage, and business continuity gear.",
    },
    {
      title: "Business Software",
      description:
        "POS platforms, inventory apps, reporting tools, and systems that connect operations.",
    },
    {
      title: "Troubleshooting",
      description:
        "Fixes for printer pairing, scanner setup, network drops, and hardware compatibility issues.",
    },
  ] satisfies HomeCategoryEntry[],
  heroEvaluation: [
    {
      title: "Compatibility",
      description: "Does it work with the systems businesses already use?",
    },
    {
      title: "Setup",
      description:
        "How much time and technical effort does deployment require?",
    },
    {
      title: "Reliability",
      description:
        "How does it handle daily operation, reconnection, and failure?",
    },
    {
      title: "Value",
      description: "What is the real cost after accessories and subscriptions?",
    },
  ] satisfies HeroEvaluationItem[],
  heroEvaluationLabel: "How we evaluate",
  heroSteps: ["Research", "Verify", "Explain"],
  featuredEyebrow: "Featured",
  featuredHeading: "Practical buying guides",
  latestEyebrow: "Latest",
  latestHeading: "New from Devicefield",
  evaluationEyebrow: "Evaluation system",
  evaluationHeading: "Evidence for the decisions that affect daily operations.",
  evaluationIntro:
    "Guides consider deployment effort, total cost, compatibility, reliability, and the practical limits a business needs to know before buying.",
  evaluationFactors: [
    {
      title: "Compatibility",
      description: "Required systems, drivers, accessories, and integrations.",
    },
    {
      title: "Setup effort",
      description: "The time and technical work needed to deploy it.",
    },
    {
      title: "Reliability",
      description:
        "Daily operation, reconnect behavior, failure, and recovery.",
    },
    {
      title: "Total value",
      description:
        "Purchase cost, subscriptions, supplies, and switching risk.",
    },
  ] satisfies HeroEvaluationItem[],
  newsletterEyebrow: "Free checklist",
  newsletterHeading: "Get the Business Technology Checklist",
  newsletterIntro:
    "A practical checklist for selecting POS hardware, scanners, printers, networking equipment, and backup power.",
};

const blogContent = {
  eyebrow: "Field notes",
  heading: "Reviews, comparisons, and operating guides.",
  intro:
    "Buying guides, product reviews, comparisons, setup notes, and troubleshooting help for the devices and systems businesses rely on.",
};

const searchContent = {
  eyebrow: "Search Devicefield",
  heading: "Find the right field note.",
  intro:
    "Search independent buying guides, reviews, comparisons, setup notes, compatibility guidance, and troubleshooting articles.",
  resultsEyebrow: "Published coverage",
  emptyHeading: "Try a broader search.",
  emptyIntro:
    "Remove one or more filters, check the spelling, or browse all currently published guides.",
};

const aboutContent = {
  eyebrow: "About Devicefield",
  heading: "Practical technology guidance for modern businesses.",
  intro:
    "Devicefield helps business owners and operators choose, connect, and troubleshoot the devices and systems their teams rely on.",
  missionHeading: "Useful answers before expensive decisions.",
  missionBody:
    "Coverage focuses on barcode and inventory systems, receipt and label printing, POS hardware, networking and uptime, business software, and the problems that appear when those systems need to work together.",
  standardsHeading: "How coverage is labeled",
  standardsBody:
    "Hands-on testing is identified only when an article includes real testing notes, screenshots, photos, measurements, or other direct evidence. Otherwise, recommendations are clearly presented as researched or spec-reviewed.",
  independenceHeading: "Independent and affiliate-supported",
  independenceBody:
    "Some links may earn Devicefield a commission at no additional cost to the reader. Affiliate relationships do not guarantee coverage or a positive recommendation, and tradeoffs remain part of every useful guide.",
};

const contactContent = {
  eyebrow: "Contact",
  heading: "Questions, corrections, and useful product context.",
  intro:
    "Devicefield welcomes factual corrections, reader questions, and relevant information that can improve published guidance.",
  sections: [
    {
      title: "Editorial and corrections",
      body: "Email contact@devicefield.com with the article URL, the detail that needs review, and a source when available.",
    },
    {
      title: "Products and review access",
      body: "Vendors may share documentation or offer review access, but access does not guarantee coverage or a positive recommendation.",
    },
    {
      title: "Response expectations",
      body: "Messages are reviewed manually. Devicefield prioritizes corrections and questions tied to published business-device guidance.",
    },
  ],
};

const reviewMethodologyContent = {
  eyebrow: "Review methodology",
  heading: "How Devicefield evaluates business technology.",
  intro:
    "The process changes with the product, but the evidence label and the core evaluation questions remain consistent.",
  sections: [
    {
      title: "Testing status",
      body: "Tested means hands-on evidence is documented. Researched means the article relies on specifications, documentation, demonstrations, and credible sources. Mixed means only part of the recommendation set was tested directly.",
    },
    {
      title: "Compatibility",
      body: "We check required operating systems, ports, drivers, accessories, integrations, media, subscriptions, and other dependencies that affect deployment.",
    },
    {
      title: "Setup and reliability",
      body: "When hands-on access is available, notes focus on setup time, reconnect behavior, normal operation, failure handling, and recovery. Research-only coverage clearly says what could not be verified directly.",
    },
    {
      title: "Value and limitations",
      body: "Evaluation includes required accessories, ongoing subscriptions, replacement supplies, switching costs, support constraints, known limitations, and credible alternatives.",
    },
    {
      title: "Updates and corrections",
      body: "Commercial and compatibility details can change. Articles include review dates where available, and material corrections are welcomed through the contact page.",
    },
  ],
};

const editorialPolicyContent = {
  eyebrow: "Editorial policy",
  heading: "Evidence first, labels that match the work.",
  intro:
    "Devicefield separates what was observed directly from what was verified through documentation and other sources.",
  sections: [
    {
      title: "No fabricated testing",
      body: "A product is described as tested only when the article includes genuine hands-on notes, screenshots, photos, measurements, or other original evidence.",
    },
    {
      title: "Sources and claims",
      body: "Important factual, numerical, compatibility, pricing, and commercial claims should be tied to current sources. Unresolved high-risk claims should not be published.",
    },
    {
      title: "Recommendations",
      body: "Best-for recommendations should explain selection criteria, who the product fits, who should avoid it, known limitations, and reasonable alternatives.",
    },
    {
      title: "Commercial independence",
      body: "Affiliate eligibility, commissions, vendor access, and advertising do not guarantee coverage or determine a positive conclusion.",
    },
    {
      title: "Corrections",
      body: "Material errors should be corrected promptly. Readers and vendors can submit a correction with supporting evidence through the contact page.",
    },
  ],
};

const affiliateDisclosureContent = {
  eyebrow: "Affiliate disclosure",
  heading: "How partner links support Devicefield.",
  intro:
    "Some articles contain clearly identified partner links. Devicefield may earn a commission when a reader makes a qualifying purchase through one of those links.",
  sections: [
    {
      title: "No added reader cost",
      body: "A qualifying purchase may generate a commission without changing the price paid by the reader, although prices and terms are controlled by the seller.",
    },
    {
      title: "Disclosure in articles",
      body: "Articles with affiliate-linked recommendations display a disclosure near the article introduction. Affiliate buttons are labeled and use sponsored link attributes.",
    },
    {
      title: "Editorial separation",
      body: "Compensation does not guarantee coverage, placement, an award, or a positive recommendation. Tradeoffs and alternatives remain part of the editorial decision.",
    },
    {
      title: "Verify before buying",
      body: "Pricing, availability, compatibility, and program terms can change. Readers should confirm important details with the seller before purchasing.",
    },
  ],
};

const termsContent = {
  eyebrow: "Policy",
  heading: "Terms of Use",
  intro:
    "These terms apply to use of Devicefield.com and its informational content.",
  sections: [
    {
      title: "Informational content",
      body: "Devicefield content is general information, not legal, financial, security, procurement, or individualized technical advice. Evaluate products against your own requirements.",
    },
    {
      title: "Changing product information",
      body: "Pricing, availability, features, compatibility, and support terms can change. Verify material details with the manufacturer, vendor, or service provider before purchasing or deploying a product.",
    },
    {
      title: "Website use",
      body: "Do not misuse the website, attempt unauthorized access, interfere with operation, submit abusive automated requests, or reproduce substantial content without permission.",
    },
    {
      title: "Third-party services",
      body: "Devicefield links to third-party websites that control their own products, terms, availability, privacy practices, and transactions.",
    },
    {
      title: "Updates",
      body: "These terms may be updated as the publication and its services change. Continued use of the site is subject to the current published version.",
    },
  ],
};

const privacyContent = {
  eyebrow: "Policy",
  heading: "Privacy Policy",
  intro:
    "This policy explains what Devicefield collects and how that information is used.",
  sections: [
    {
      title: "Newsletter data",
      body: "When you subscribe, Devicefield stores your email address, consent and confirmation timestamps, subscription status, and the page where you subscribed. A confirmation email is required before marketing emails are sent.",
    },
    {
      title: "Email providers",
      body: "Confirmed subscriber information may be synchronized with an email delivery provider to send requested messages, process delivery events, and honor unsubscribe requests.",
    },
    {
      title: "Security and abuse prevention",
      body: "Devicefield uses short-lived rate-limit records, hashed request identifiers, and anti-bot fields to reduce abuse. Raw IP addresses are not stored in the newsletter subscription table.",
    },
    {
      title: "Affiliate and website data",
      body: "Devicefield may record limited click and referral information for affiliate links and site performance. This information is used to understand content performance and maintain the website.",
    },
    {
      title: "Your choices",
      body: "You can unsubscribe at any time using the link in Devicefield emails. To ask about, correct, or delete your information, contact contact@devicefield.com.",
    },
  ],
};

export const defaultSitePages: Record<SitePageSlug, SitePage> = {
  global: {
    slug: "global",
    title: "Devicefield publication settings",
    meta_description: "Shared Devicefield navigation and footer content.",
    content: globalContent,
  },
  home: {
    slug: "home",
    title: "Devicefield | Business Technology Reviews & Buying Guides",
    meta_description:
      "Independent reviews, buying guides, comparisons, setup help, and troubleshooting for POS, barcode, printing, networking, and business systems.",
    content: homeContent,
  },
  blog: {
    slug: "blog",
    title: "Business Device and Systems Guides - Devicefield",
    meta_description:
      "Browse Devicefield buying guides, business system reviews, security checklists, and implementation playbooks.",
    content: blogContent,
  },
  search: {
    slug: "search",
    title: "Search Devicefield Business Technology Guides",
    meta_description:
      "Search Devicefield buying guides, product reviews, comparisons, compatibility notes, setup guides, and troubleshooting articles.",
    content: searchContent,
  },
  about: {
    slug: "about",
    title: "About Devicefield - Independent Business Technology Publication",
    meta_description:
      "Learn how Devicefield researches business devices and systems, labels hands-on testing, and maintains independent editorial standards.",
    content: aboutContent,
  },
  contact: {
    slug: "contact",
    title: "Contact Devicefield",
    meta_description:
      "Contact Devicefield to submit corrections, share product information, ask editorial questions, or provide feedback about business technology coverage.",
    content: contactContent,
  },
  "review-methodology": {
    slug: "review-methodology",
    title: "Review Methodology - Devicefield",
    meta_description:
      "Learn how Devicefield evaluates compatibility, setup, reliability, value, and evidence for business technology coverage.",
    content: reviewMethodologyContent,
  },
  "editorial-policy": {
    slug: "editorial-policy",
    title: "Editorial Policy - Devicefield",
    meta_description:
      "Read Devicefield editorial standards for sourcing, testing labels, corrections, independence, and affiliate relationships.",
    content: editorialPolicyContent,
  },
  "affiliate-disclosure": {
    slug: "affiliate-disclosure",
    title: "Affiliate Disclosure - Devicefield",
    meta_description:
      "Learn how Devicefield identifies affiliate links, earns commissions, protects editorial independence, and discloses commercial relationships.",
    content: affiliateDisclosureContent,
  },
  terms: {
    slug: "terms",
    title: "Terms of Use - Devicefield",
    meta_description:
      "Review the terms governing Devicefield articles, website features, intellectual property, external links, disclaimers, and acceptable use.",
    content: termsContent,
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy - Devicefield",
    meta_description:
      "Learn how Devicefield collects, uses, protects, and retains newsletter, analytics, affiliate referral, and website usage information.",
    content: privacyContent,
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
  return getPolicySections(content, termsContent.sections);
}

export function getPrivacySections(content: Record<string, unknown>) {
  return getPolicySections(content, privacyContent.sections);
}

export function getPolicyPageSections(
  slug:
    | "contact"
    | "review-methodology"
    | "editorial-policy"
    | "affiliate-disclosure",
  content: Record<string, unknown>,
) {
  const fallback = defaultSitePages[slug].content.sections;
  return getPolicySections(
    content,
    Array.isArray(fallback) ? (fallback as TermsSection[]) : [],
  );
}

function getPolicySections(
  content: Record<string, unknown>,
  fallback: TermsSection[],
) {
  const value = content.sections;
  if (!Array.isArray(value)) return fallback;

  const sections = value.filter(
    (section): section is TermsSection =>
      typeof section === "object" &&
      section !== null &&
      typeof (section as TermsSection).title === "string" &&
      typeof (section as TermsSection).body === "string",
  );

  return sections.length > 0 ? sections : fallback;
}

export function getObjectArray<T extends Record<string, string>>(
  content: Record<string, unknown>,
  key: string,
  fallback: T[],
  requiredKeys: Array<keyof T>,
) {
  const value = content[key];
  if (!Array.isArray(value)) return fallback;

  const rows = value.filter(
    (item): item is T =>
      typeof item === "object" &&
      item !== null &&
      requiredKeys.every(
        (requiredKey) => typeof item[requiredKey] === "string",
      ),
  );

  return rows.length > 0 ? rows : fallback;
}
