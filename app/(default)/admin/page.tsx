"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingAnimation from "@/components/loading-animation";
import { createClient } from "@/lib/supabase/client";
import {
  AFFILIATE_NETWORKS,
  AFFILIATE_PROGRAM_STATUSES,
  type AffiliateClickEvent,
  type AffiliateLink,
  type AffiliateNetwork,
  type AffiliateProgram,
  type AffiliateProgramStatus,
} from "@/lib/affiliate/types";
import {
  AFFILIATE_PROGRAMS,
  BLOG_CATEGORIES,
  slugify,
  type BlogPost,
  type BlogPostStatus,
} from "@/lib/blog/types";
import {
  defaultSitePages,
  type SitePage,
  type SitePageSlug,
} from "@/lib/site/pages";

type BlogPostForm = {
  title: string;
  slug: string;
  excerpt: string;
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
  category: string;
  tagsInput: string;
  affiliateProgramsInput: string;
  coverImageUrl: string;
  coverImageAlt: string;
  canonicalUrl: string;
  faqInput: string;
  status: BlogPostStatus;
  featured: boolean;
  publishedAt: string;
};

type SitePageForm = {
  slug: SitePageSlug;
  title: string;
  metaDescription: string;
  contentInput: string;
};

type AffiliateProgramForm = {
  name: string;
  network: AffiliateNetwork;
  status: AffiliateProgramStatus;
  commissionSummary: string;
  cookieDuration: string;
  payoutNotes: string;
  termsUrl: string;
  approvedAt: string;
  notes: string;
};

type AffiliateLinkForm = {
  slug: string;
  label: string;
  programId: string;
  destinationUrl: string;
  useRedirect: boolean;
  active: boolean;
  disclosureRequired: boolean;
};

type AdminSection = "articles" | "pages" | "newsletter" | "affiliates";

type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string | null;
  status: "subscribed" | "unsubscribed";
  created_at: string;
};

type AdminAffiliateClick = AffiliateClickEvent & {
  affiliate_links?: (Pick<
    AffiliateLink,
    "id" | "label" | "slug" | "program_id"
  > & {
    affiliate_programs?: Pick<
      AffiliateProgram,
      "id" | "name" | "network" | "status"
    > | null;
  }) | null;
  blog_posts?: Pick<BlogPost, "id" | "title" | "slug"> | null;
};

type AffiliateProgramSummary = Pick<
  AffiliateProgram,
  "id" | "name" | "network" | "status"
>;

type AffiliateLinkSummary = Pick<
  AffiliateLink,
  "id" | "label" | "slug" | "program_id"
> & {
  affiliate_programs?: AffiliateProgramSummary | AffiliateProgramSummary[] | null;
};

type AdminAffiliateClickRaw = AffiliateClickEvent & {
  affiliate_links?: AffiliateLinkSummary | AffiliateLinkSummary[] | null;
  blog_posts?: Pick<BlogPost, "id" | "title" | "slug"> | Array<
    Pick<BlogPost, "id" | "title" | "slug">
  > | null;
};

type MetricRow = {
  label: string;
  value: number;
};

const emptyForm: BlogPostForm = {
  title: "",
  slug: "",
  excerpt: "",
  focusKeyword: "",
  seoTitle: "",
  metaDescription: "",
  content: "",
  category: BLOG_CATEGORIES[0],
  tagsInput: "",
  affiliateProgramsInput: "",
  coverImageUrl: "",
  coverImageAlt: "",
  canonicalUrl: "",
  faqInput: "",
  status: "draft",
  featured: false,
  publishedAt: "",
};

const sitePageSlugs = Object.keys(defaultSitePages) as SitePageSlug[];
const defaultPages = sitePageSlugs.map((slug) => defaultSitePages[slug]);

function toSitePageForm(page: SitePage): SitePageForm {
  return {
    slug: page.slug,
    title: page.title,
    metaDescription: page.meta_description,
    contentInput: JSON.stringify(page.content, null, 2),
  };
}

const emptyPageForm = toSitePageForm(defaultSitePages.home);
const emptyAffiliateProgramForm: AffiliateProgramForm = {
  name: "",
  network: "other",
  status: "not_applied",
  commissionSummary: "",
  cookieDuration: "",
  payoutNotes: "",
  termsUrl: "",
  approvedAt: "",
  notes: "",
};
const emptyAffiliateLinkForm: AffiliateLinkForm = {
  slug: "",
  label: "Check price",
  programId: "",
  destinationUrl: "",
  useRedirect: true,
  active: true,
  disclosureRequired: true,
};
const ARTICLE_IMAGE_BUCKET = "article-images";
const MAX_ARTICLE_IMAGE_BYTES = 10 * 1024 * 1024;
const imageMimeTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getImageFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (file.type === "image/gif") return "gif";

  return "jpg";
}

function getDefaultImageAlt(file: File) {
  return file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function includesKeyword(value: string, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;
  return normalizeText(value).includes(normalizedKeyword);
}

function keywordWithinFirstWords(value: string, keyword: string, limit: number) {
  const firstWords = value.trim().split(/\s+/).slice(0, limit).join(" ");
  return includesKeyword(firstWords, keyword);
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function countH2Headings(value: string) {
  return (value.match(/^##\s+/gm) ?? []).length;
}

function getMarkdownLinks(value: string) {
  return Array.from(
    value.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)(\{sponsored\})?/g),
  ).map((match) => ({
    label: match[1],
    href: match[2],
    sponsored: Boolean(match[3]),
  }));
}

function getMarkdownImages(value: string) {
  return Array.from(
    value.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g),
  ).map((match) => ({
    alt: match[1],
    src: match[2],
  }));
}

function parseFaqInput(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...answerParts] = line.split("|");
      return {
        question: question?.trim() ?? "",
        answer: answerParts.join("|").trim(),
      };
    })
    .filter((item) => item.question && item.answer);
}

function formatFaqInput(value: BlogPost["faq_items"]) {
  return (value ?? [])
    .map((item) => `${item.question} | ${item.answer}`)
    .join("\n");
}

function hasCallToAction(value: string) {
  return /\b(read|compare|learn|choose|get|see|try|find|discover|start)\b/i.test(
    value,
  );
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function isSitePageSlug(value: string): value is SitePageSlug {
  return sitePageSlugs.includes(value as SitePageSlug);
}

function mergeSitePages(records: Array<Partial<SitePage> & { slug?: string }>) {
  const recordBySlug = new Map(
    records
      .filter((record) => record.slug && isSitePageSlug(record.slug))
      .map((record) => [record.slug as SitePageSlug, record]),
  );

  return sitePageSlugs.map((slug) => {
    const fallback = defaultSitePages[slug];
    const record = recordBySlug.get(slug);
    const content =
      record?.content && typeof record.content === "object"
        ? { ...fallback.content, ...record.content }
        : fallback.content;

    return {
      ...fallback,
      ...record,
      slug,
      title: record?.title || fallback.title,
      meta_description: record?.meta_description || fallback.meta_description,
      content,
    };
  });
}

function safeParseJson(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function getPreviewString(
  content: Record<string, unknown> | null,
  key: string,
  fallback: string,
) {
  const value = content?.[key];
  return typeof value === "string" ? value : fallback;
}

function getPreviewList(
  content: Record<string, unknown> | null,
  key: string,
  fallback: string[],
) {
  const value = content?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : fallback;
}

function formatSubscriberDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function buildSubscribersCsv(subscribers: NewsletterSubscriber[]) {
  const rows = [
    ["email", "status", "source", "created_at"],
    ...subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.status,
      subscriber.source ?? "",
      subscriber.created_at,
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

function formatOptionLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMetricRows(labels: string[]) {
  const counts = labels.reduce((map, label) => {
    map.set(label, (map.get(label) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function firstRelated<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function normalizeAffiliateClicks(rows: AdminAffiliateClickRaw[]) {
  return rows.map((row) => {
    const affiliateLink = firstRelated(row.affiliate_links);
    const affiliateProgram = firstRelated(affiliateLink?.affiliate_programs);

    return {
      ...row,
      affiliate_links: affiliateLink
        ? {
            ...affiliateLink,
            affiliate_programs: affiliateProgram,
          }
        : null,
      blog_posts: firstRelated(row.blog_posts),
    };
  });
}

function MetricList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: MetricRow[];
  emptyLabel: string;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-zinc-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-zinc-800">
                {row.label}
              </p>
              <p className="text-xl font-semibold text-zinc-950">{row.value}</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pages, setPages] = useState<SitePage[]>(defaultPages);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<AffiliateProgram[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [affiliateClicks, setAffiliateClicks] = useState<AdminAffiliateClick[]>([]);
  const [activeSection, setActiveSection] = useState<AdminSection>("articles");
  const [formData, setFormData] = useState<BlogPostForm>(emptyForm);
  const [pageFormData, setPageFormData] =
    useState<SitePageForm>(emptyPageForm);
  const [affiliateProgramForm, setAffiliateProgramForm] =
    useState<AffiliateProgramForm>(emptyAffiliateProgramForm);
  const [affiliateLinkForm, setAffiliateLinkForm] =
    useState<AffiliateLinkForm>(emptyAffiliateLinkForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAffiliateProgramId, setEditingAffiliateProgramId] =
    useState<string | null>(null);
  const [editingAffiliateLinkId, setEditingAffiliateLinkId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageSaving, setPageSaving] = useState(false);
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [bodyImageUploading, setBodyImageUploading] = useState(false);
  const [bodyImageAlt, setBodyImageAlt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const pagePreviewContent = useMemo(
    () => safeParseJson(pageFormData.contentInput),
    [pageFormData.contentInput],
  );
  const clicksByArticle = useMemo(
    () =>
      getMetricRows(
        affiliateClicks.map(
          (click) => click.blog_posts?.title ?? "Direct or unknown article",
        ),
      ),
    [affiliateClicks],
  );
  const clicksByProgram = useMemo(
    () =>
      getMetricRows(
        affiliateClicks.map(
          (click) =>
            click.affiliate_links?.affiliate_programs?.name ?? "Unknown program",
        ),
      ),
    [affiliateClicks],
  );
  const clicksByPlacement = useMemo(
    () =>
      getMetricRows(
        affiliateClicks.map((click) => click.cta_placement ?? "Unspecified"),
      ),
    [affiliateClicks],
  );
  const inactiveOrBrokenLinks = useMemo(
    () =>
      affiliateLinks.filter(
        (link) => !link.active || link.destination_url.trim().length === 0,
      ),
    [affiliateLinks],
  );
  const activePageDefaults = defaultSitePages[pageFormData.slug].content;
  const excerptCharacters = formData.excerpt.length;
  const seoTitle = formData.seoTitle.trim() || formData.title.trim();
  const metaDescription =
    formData.metaDescription.trim() || formData.excerpt.trim();
  const wordCount = countWords(formData.content);
  const h2Count = countH2Headings(formData.content);
  const links = getMarkdownLinks(formData.content);
  const internalLinks = links.filter((link) => link.href.startsWith("/"));
  const dofollowExternalLinks = links.filter(
    (link) => link.href.startsWith("http") && !link.sponsored,
  );
  const bodyImages = getMarkdownImages(formData.content);
  const seoChecks = useMemo(
    () => [
      {
        label: "Focus keyword is set.",
        passed: formData.focusKeyword.trim().length > 0,
        points: 10,
      },
      {
        label: "SEO title contains keyword in the first 3 words.",
        passed: keywordWithinFirstWords(seoTitle, formData.focusKeyword, 3),
        points: 10,
      },
      {
        label: "SEO title is 35-70 characters.",
        passed: seoTitle.length >= 35 && seoTitle.length <= 70,
        points: 10,
      },
      {
        label: "Meta description is 120-160 characters.",
        passed: metaDescription.length >= 120 && metaDescription.length <= 160,
        points: 10,
      },
      {
        label: "Meta description includes keyword and CTA language.",
        passed:
          includesKeyword(metaDescription, formData.focusKeyword) &&
          hasCallToAction(metaDescription),
        points: 10,
      },
      {
        label: "Slug is clean, short, and keyword-aligned.",
        passed:
          formData.slug.length > 0 &&
          formData.slug.length <= 60 &&
          includesKeyword(formData.slug.replaceAll("-", " "), formData.focusKeyword),
        points: 10,
      },
      {
        label: "Featured image alt text includes keyword.",
        passed:
          !formData.coverImageUrl.trim() ||
          includesKeyword(formData.coverImageAlt, formData.focusKeyword),
        points: 10,
      },
      {
        label: "Article body is 1,000+ words.",
        passed: wordCount >= 1000,
        points: 10,
      },
      {
        label: "Article has 3+ H2 sections.",
        passed: h2Count >= 3,
        points: 10,
      },
      {
        label: "Article has 3+ internal links.",
        passed: internalLinks.length >= 3,
        points: 5,
      },
      {
        label: "Article has 2+ authoritative dofollow external links.",
        passed: dofollowExternalLinks.length >= 2,
        points: 5,
      },
      {
        label: "Body images include descriptive alt text.",
        passed:
          bodyImages.length === 0 ||
          bodyImages.every((image) => image.alt.trim().length >= 8),
        points: 5,
      },
    ],
    [
      bodyImages,
      dofollowExternalLinks.length,
      formData.coverImageAlt,
      formData.coverImageUrl,
      formData.focusKeyword,
      formData.slug,
      h2Count,
      internalLinks.length,
      metaDescription,
      seoTitle,
      wordCount,
    ],
  );
  const estimatedSeoScore = seoChecks.reduce(
    (score, check) => score + (check.passed ? check.points : 0),
    0,
  );

  useEffect(() => {
    const supabase = createClient();

    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        setErrorMessage(
          `Unable to load blog posts. Run the blog SQL setup first. ${error.message}`,
        );
      } else {
        setPosts((data ?? []) as BlogPost[]);
      }
    };

    const fetchSubscribers = async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id,email,source,status,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(
          `Unable to load newsletter subscribers. Run the updated Supabase migration first. ${error.message}`,
        );
      } else {
        setSubscribers((data ?? []) as NewsletterSubscriber[]);
      }
    };

    const fetchPages = async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("slug,title,meta_description,content,updated_at")
        .order("slug", { ascending: true });

      if (error) {
        setErrorMessage(
          `Unable to load site pages. Run the updated Supabase migration first. ${error.message}`,
        );
      } else {
        const mergedPages = mergeSitePages(
          (data ?? []) as Array<Partial<SitePage> & { slug?: string }>,
        );
        setPages(mergedPages);
        setPageFormData((current) => {
          const page =
            mergedPages.find((item) => item.slug === current.slug) ??
            defaultSitePages[current.slug];
          return toSitePageForm(page);
        });
      }
    };

    const fetchAffiliateData = async () => {
      const [programsResult, linksResult, clicksResult] = await Promise.all([
        supabase
          .from("affiliate_programs")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("affiliate_links")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("affiliate_click_events")
          .select(
            "id,affiliate_link_id,article_id,cta_placement,referrer,user_agent_hash,country,created_at,affiliate_links(id,label,slug,program_id,affiliate_programs(id,name,network,status)),blog_posts(id,title,slug)",
          )
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (programsResult.error) {
        setErrorMessage(`Unable to load affiliate programs. ${programsResult.error.message}`);
      } else {
        setAffiliatePrograms((programsResult.data ?? []) as AffiliateProgram[]);
      }

      if (linksResult.error) {
        setErrorMessage(`Unable to load affiliate links. ${linksResult.error.message}`);
      } else {
        setAffiliateLinks((linksResult.data ?? []) as AffiliateLink[]);
      }

      if (clicksResult.error) {
        setErrorMessage(`Unable to load affiliate clicks. ${clicksResult.error.message}`);
      } else {
        setAffiliateClicks(
          normalizeAffiliateClicks(
            (clicksResult.data ?? []) as unknown as AdminAffiliateClickRaw[],
          ),
        );
      }
    };

    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/devicefield-editor-login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchPosts(),
        fetchPages(),
        fetchSubscribers(),
        fetchAffiliateData(),
      ]);
      setLoading(false);
    };

    void checkAdmin();
  }, [router]);

  const refreshPosts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPosts((data ?? []) as BlogPost[]);
  };

  const refreshPages = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_pages")
      .select("slug,title,meta_description,content,updated_at")
      .order("slug", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const mergedPages = mergeSitePages(
      (data ?? []) as Array<Partial<SitePage> & { slug?: string }>,
    );
    setPages(mergedPages);
    setPageFormData((current) => {
      const page =
        mergedPages.find((item) => item.slug === current.slug) ??
        defaultSitePages[current.slug];
      return toSitePageForm(page);
    });
  };

  const refreshSubscribers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("id,email,source,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSubscribers((data ?? []) as NewsletterSubscriber[]);
  };

  const refreshAffiliateData = async () => {
    const supabase = createClient();
    const [programsResult, linksResult, clicksResult] = await Promise.all([
      supabase
        .from("affiliate_programs")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("affiliate_links")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("affiliate_click_events")
        .select(
          "id,affiliate_link_id,article_id,cta_placement,referrer,user_agent_hash,country,created_at,affiliate_links(id,label,slug,program_id,affiliate_programs(id,name,network,status)),blog_posts(id,title,slug)",
        )
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (programsResult.error) {
      setErrorMessage(programsResult.error.message);
    } else {
      setAffiliatePrograms((programsResult.data ?? []) as AffiliateProgram[]);
    }

    if (linksResult.error) {
      setErrorMessage(linksResult.error.message);
    } else {
      setAffiliateLinks((linksResult.data ?? []) as AffiliateLink[]);
    }

    if (clicksResult.error) {
      setErrorMessage(clicksResult.error.message);
    } else {
      setAffiliateClicks(
        normalizeAffiliateClicks(
          (clicksResult.data ?? []) as unknown as AdminAffiliateClickRaw[],
        ),
      );
    }
  };

  const resetForm = (clearMessages = true) => {
    setEditingId(null);
    setFormData(emptyForm);
    if (clearMessages) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handlePageEdit = (slug: SitePageSlug) => {
    const page = pages.find((current) => current.slug === slug) ?? defaultSitePages[slug];
    setPageFormData(toSitePageForm(page));
    setActiveSection("pages");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTitleChange = (title: string) => {
    setFormData((current) => ({
      ...current,
      title,
      slug: editingId || current.slug ? current.slug : slugify(title),
    }));
  };

  const uploadArticleImage = async (file: File, folder: "covers" | "body") => {
    if (!imageMimeTypes.has(file.type)) {
      throw new Error("Upload an AVIF, GIF, JPG, PNG, or WebP image.");
    }

    if (file.size > MAX_ARTICLE_IMAGE_BYTES) {
      throw new Error("Image uploads must be 10MB or smaller.");
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/devicefield-editor-login");
      throw new Error("Sign in again before uploading images.");
    }

    const articleSlug = slugify(formData.slug || formData.title) || "draft";
    const fileSlug = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
    const extension = getImageFileExtension(file);
    const path = `${folder}/${articleSlug}/${Date.now()}-${fileSlug}.${extension}`;
    const { error } = await supabase.storage
      .from(ARTICLE_IMAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(ARTICLE_IMAGE_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCoverUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const publicUrl = await uploadArticleImage(file, "covers");
      const defaultAlt = getDefaultImageAlt(file);
      setFormData((current) => ({
        ...current,
        coverImageUrl: publicUrl,
        coverImageAlt: current.coverImageAlt.trim() || defaultAlt,
      }));
      setSuccessMessage("Cover image uploaded and attached to the article.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload cover image.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleBodyImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBodyImageUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const publicUrl = await uploadArticleImage(file, "body");
      const alt = bodyImageAlt.trim() || getDefaultImageAlt(file) || "Article image";
      const markdown = `![${alt}](${publicUrl})`;
      setFormData((current) => ({
        ...current,
        content: `${current.content.trimEnd()}\n\n${markdown}\n\n`,
      }));
      setBodyImageAlt("");
      setSuccessMessage("Image uploaded and inserted into the article body.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload article image.");
    } finally {
      setBodyImageUploading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      focusKeyword: post.focus_keyword ?? "",
      seoTitle: post.seo_title ?? post.title,
      metaDescription: post.meta_description ?? post.excerpt,
      content: post.content,
      category: post.category,
      tagsInput: post.tags.join(", "),
      affiliateProgramsInput: post.affiliate_programs.join(", "),
      coverImageUrl: post.cover_image_url ?? "",
      coverImageAlt: post.cover_image_alt ?? post.title,
      canonicalUrl: post.canonical_url ?? "",
      faqInput: formatFaqInput(post.faq_items),
      status: post.status,
      featured: post.featured,
      publishedAt: toDatetimeLocal(post.published_at),
    });
    setActiveSection("articles");
    setErrorMessage(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/devicefield-editor-login");
      return;
    }

    const slug = slugify(formData.slug || formData.title);
    const publishedAt =
      formData.status === "published"
        ? new Date(formData.publishedAt || Date.now()).toISOString()
        : formData.publishedAt
          ? new Date(formData.publishedAt).toISOString()
          : null;

    const payload = {
      title: formData.title.trim(),
      slug,
      excerpt: formData.excerpt.trim(),
      focus_keyword: formData.focusKeyword.trim() || null,
      seo_title: formData.seoTitle.trim() || formData.title.trim(),
      meta_description: formData.metaDescription.trim() || formData.excerpt.trim(),
      content: formData.content.trim(),
      category: formData.category,
      tags: splitList(formData.tagsInput),
      affiliate_programs: splitList(formData.affiliateProgramsInput),
      cover_image_url: formData.coverImageUrl.trim() || null,
      cover_image_alt: formData.coverImageAlt.trim() || null,
      canonical_url: formData.canonicalUrl.trim() || null,
      faq_items: parseFaqInput(formData.faqInput),
      status: formData.status,
      featured: formData.featured,
      published_at: publishedAt,
    };

    const result = editingId
      ? await supabase.from("blog_posts").update(payload).eq("id", editingId)
      : await supabase.from("blog_posts").insert({
          ...payload,
          created_by: user.id,
        });

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setSuccessMessage(editingId ? "Article updated." : "Article created.");
      resetForm(false);
      await refreshPosts();
    }

    setSaving(false);
  };

  const handlePageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(pageFormData.contentInput);
    } catch {
      setErrorMessage("Page content must be valid JSON.");
      setPageSaving(false);
      return;
    }

    if (
      !parsedContent ||
      typeof parsedContent !== "object" ||
      Array.isArray(parsedContent)
    ) {
      setErrorMessage("Page content must be a JSON object.");
      setPageSaving(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPageSaving(false);
      router.push("/devicefield-editor-login");
      return;
    }

    const result = await supabase.from("site_pages").upsert(
      {
        slug: pageFormData.slug,
        title: pageFormData.title.trim(),
        meta_description: pageFormData.metaDescription.trim(),
        content: parsedContent,
      },
      { onConflict: "slug" },
    );

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setSuccessMessage("Site page updated.");
      await refreshPages();
    }

    setPageSaving(false);
  };

  const resetAffiliateProgramForm = (clearMessages = true) => {
    setEditingAffiliateProgramId(null);
    setAffiliateProgramForm(emptyAffiliateProgramForm);
    if (clearMessages) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const resetAffiliateLinkForm = (clearMessages = true) => {
    setEditingAffiliateLinkId(null);
    setAffiliateLinkForm({
      ...emptyAffiliateLinkForm,
      programId: affiliatePrograms[0]?.id ?? "",
    });
    if (clearMessages) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handleAffiliateProgramEdit = (program: AffiliateProgram) => {
    setEditingAffiliateProgramId(program.id);
    setAffiliateProgramForm({
      name: program.name,
      network: program.network,
      status: program.status,
      commissionSummary: program.commission_summary ?? "",
      cookieDuration: program.cookie_duration ?? "",
      payoutNotes: program.payout_notes ?? "",
      termsUrl: program.terms_url ?? "",
      approvedAt: toDatetimeLocal(program.approved_at),
      notes: program.notes ?? "",
    });
    setActiveSection("affiliates");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAffiliateLinkEdit = (link: AffiliateLink) => {
    setEditingAffiliateLinkId(link.id);
    setAffiliateLinkForm({
      slug: link.slug,
      label: link.label,
      programId: link.program_id,
      destinationUrl: link.destination_url,
      useRedirect: link.use_redirect,
      active: link.active,
      disclosureRequired: link.disclosure_required,
    });
    setActiveSection("affiliates");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAffiliateProgramSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAffiliateSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      name: affiliateProgramForm.name.trim(),
      network: affiliateProgramForm.network,
      status: affiliateProgramForm.status,
      commission_summary: affiliateProgramForm.commissionSummary.trim() || null,
      cookie_duration: affiliateProgramForm.cookieDuration.trim() || null,
      payout_notes: affiliateProgramForm.payoutNotes.trim() || null,
      terms_url: affiliateProgramForm.termsUrl.trim() || null,
      approved_at: affiliateProgramForm.approvedAt
        ? new Date(affiliateProgramForm.approvedAt).toISOString()
        : null,
      notes: affiliateProgramForm.notes.trim() || null,
    };

    const supabase = createClient();
    const result = editingAffiliateProgramId
      ? await supabase
          .from("affiliate_programs")
          .update(payload)
          .eq("id", editingAffiliateProgramId)
      : await supabase.from("affiliate_programs").insert(payload);

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setSuccessMessage(
        editingAffiliateProgramId
          ? "Affiliate program updated."
          : "Affiliate program created.",
      );
      resetAffiliateProgramForm(false);
      await refreshAffiliateData();
    }

    setAffiliateSaving(false);
  };

  const handleAffiliateLinkSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAffiliateSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const programId = affiliateLinkForm.programId || affiliatePrograms[0]?.id;
    if (!programId) {
      setErrorMessage("Create an affiliate program before adding links.");
      setAffiliateSaving(false);
      return;
    }

    const slug = slugify(affiliateLinkForm.slug || affiliateLinkForm.label);
    const payload = {
      slug,
      label: affiliateLinkForm.label.trim(),
      program_id: programId,
      destination_url: affiliateLinkForm.destinationUrl.trim(),
      use_redirect: affiliateLinkForm.useRedirect,
      active: affiliateLinkForm.active,
      disclosure_required: affiliateLinkForm.disclosureRequired,
      rel: "sponsored nofollow" as const,
    };

    const supabase = createClient();
    const result = editingAffiliateLinkId
      ? await supabase
          .from("affiliate_links")
          .update(payload)
          .eq("id", editingAffiliateLinkId)
      : await supabase.from("affiliate_links").insert(payload);

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setSuccessMessage(
        editingAffiliateLinkId
          ? "Affiliate link updated."
          : "Affiliate link created.",
      );
      resetAffiliateLinkForm(false);
      await refreshAffiliateData();
    }

    setAffiliateSaving(false);
  };

  const exportSubscribers = () => {
    const subscribed = subscribers.filter(
      (subscriber) => subscriber.status === "subscribed",
    );
    const csv = buildSubscribersCsv(subscribed);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `devicefield-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-32">
        <LoadingAnimation className="h-24 w-24" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 px-4 pb-20 pt-32 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
              CMS
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              Devicefield CMS
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-600">
              Edit articles and core page content from Supabase without paying
              for a hosted CMS subscription.
            </p>
          </div>
          <Link
            href="/blog"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
          >
            View blog
          </Link>
        </header>

        <div className="mb-8 flex flex-wrap gap-2 rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
          {(["articles", "pages", "newsletter", "affiliates"] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                activeSection === section
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        {(errorMessage || successMessage) && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm font-medium ${
              errorMessage
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-lime-300 bg-lime-100 text-zinc-950"
            }`}
          >
            {errorMessage ?? successMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {activeSection === "articles" && (
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
            >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  {editingId ? "Edit article" : "New article"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Use Markdown for headings, lists, bold text, and links.
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">
                  Title
                </span>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  className="form-input w-full rounded-2xl border-zinc-200"
                  placeholder="Best secure laptops for remote teams in 2026"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">
                  Slug
                </span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }))
                  }
                  className="form-input w-full rounded-2xl border-zinc-200"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Focus keyword
                  </span>
                  <input
                    type="text"
                    value={formData.focusKeyword}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        focusKeyword: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                    placeholder="jasper ai review"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Canonical URL
                  </span>
                  <input
                    type="url"
                    value={formData.canonicalUrl}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        canonicalUrl: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                    placeholder={`https://devicefield.com/blog/${formData.slug || "slug"}`}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 flex justify-between text-sm font-semibold text-zinc-800">
                  <span>SEO title</span>
                  <span className={seoTitle.length > 70 ? "text-red-600" : "text-zinc-400"}>
                    {seoTitle.length}/70
                  </span>
                </span>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      seoTitle: event.target.value,
                    }))
                  }
                  className="form-input w-full rounded-2xl border-zinc-200"
                  placeholder="Keyword-first title for Google search results"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex justify-between text-sm font-semibold text-zinc-800">
                  <span>Article excerpt</span>
                  <span className={excerptCharacters > 165 ? "text-red-600" : "text-zinc-400"}>
                    {excerptCharacters}/165
                  </span>
                </span>
                <textarea
                  required
                  value={formData.excerpt}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      excerpt: event.target.value,
                    }))
                  }
                  rows={3}
                  className="form-textarea w-full rounded-2xl border-zinc-200"
                  placeholder="Short SERP-ready summary of the article."
                />
              </label>

              <label className="block">
                <span className="mb-2 flex justify-between text-sm font-semibold text-zinc-800">
                  <span>Meta description</span>
                  <span className={metaDescription.length > 160 ? "text-red-600" : "text-zinc-400"}>
                    {metaDescription.length}/160
                  </span>
                </span>
                <textarea
                  value={formData.metaDescription}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      metaDescription: event.target.value,
                    }))
                  }
                  rows={3}
                  className="form-textarea w-full rounded-2xl border-zinc-200"
                  placeholder="120-160 characters with keyword and a clear CTA."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Category
                  </span>
                  <select
                    value={formData.category}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="form-select w-full rounded-2xl border-zinc-200"
                  >
                    {BLOG_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Status
                  </span>
                  <select
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as BlogPostStatus,
                      }))
                    }
                    className="form-select w-full rounded-2xl border-zinc-200"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">
                  Article body
                </span>
                <div className="mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Body image alt text
                      </span>
                      <input
                        type="text"
                        value={bodyImageAlt}
                        onChange={(event) => setBodyImageAlt(event.target.value)}
                        className="form-input w-full rounded-2xl border-zinc-200"
                        placeholder="Descriptive image alt text"
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
                      {bodyImageUploading ? "Uploading..." : "Upload body image"}
                      <input
                        type="file"
                        accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                        onChange={handleBodyImageUpload}
                        disabled={bodyImageUploading}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Uploads to Supabase Storage and inserts a Markdown image at
                    the bottom of the article body. Move the inserted line where
                    you want the image to appear.
                  </p>
                </div>
                <textarea
                  required
                  value={formData.content}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  rows={16}
                  className="form-textarea w-full rounded-2xl border-zinc-200 font-mono text-sm leading-6"
                  placeholder={
                    "## Verdict\n\nWrite the review, comparison, or buying guide here.\n\nUse the body image uploader above to insert Supabase-hosted images.\nUse [affiliate link](https://...){sponsored} for paid links."
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">
                  FAQ items
                </span>
                <textarea
                  value={formData.faqInput}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      faqInput: event.target.value,
                    }))
                  }
                  rows={4}
                  className="form-textarea w-full rounded-2xl border-zinc-200 font-mono text-sm leading-6"
                  placeholder={"Question one? | Answer one.\nQuestion two? | Answer two."}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Tags
                  </span>
                  <input
                    type="text"
                    value={formData.tagsInput}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        tagsInput: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                    placeholder="security, laptops, remote work"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Cover image URL
                  </span>
                  <input
                    type="url"
                    value={formData.coverImageUrl}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        coverImageUrl: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                    placeholder="https://..."
                  />
                  <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950">
                    {coverUploading ? "Uploading..." : "Upload / replace cover"}
                    <input
                      type="file"
                      accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                      onChange={handleCoverImageUpload}
                      disabled={coverUploading}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Uploads to Supabase Storage and replaces the cover image URL.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Cover image alt
                  </span>
                  <input
                    type="text"
                    value={formData.coverImageAlt}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        coverImageAlt: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                    placeholder="Keyword-rich description of the featured image"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">
                  Affiliate programs mentioned
                </span>
                <input
                  type="text"
                  value={formData.affiliateProgramsInput}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      affiliateProgramsInput: event.target.value,
                    }))
                  }
                  className="form-input w-full rounded-2xl border-zinc-200"
                  placeholder="Semrush, WP Engine, Shopify"
                  list="affiliate-programs"
                />
                <datalist id="affiliate-programs">
                  {AFFILIATE_PROGRAMS.map((program) => (
                    <option key={program} value={program} />
                  ))}
                </datalist>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Publish date
                  </span>
                  <input
                    type="datetime-local"
                    value={formData.publishedAt}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        publishedAt: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        featured: event.target.checked,
                      }))
                    }
                    className="rounded border-zinc-300 text-zinc-950"
                  />
                  <span className="text-sm font-semibold text-zinc-800">
                    Feature on homepage
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update article" : "Create article"}
              </button>
            </div>
            </form>
          )}

          {activeSection === "pages" && (
            <form
              onSubmit={handlePageSubmit}
              className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Site pages
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  Edit page content
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  These fields control homepage, blog index, terms page, and
                  SEO metadata. Keep the JSON keys intact.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Page
                  </span>
                  <select
                    value={pageFormData.slug}
                    onChange={(event) =>
                      handlePageEdit(event.target.value as SitePageSlug)
                    }
                    className="form-select w-full rounded-2xl border-zinc-200"
                  >
                    {sitePageSlugs.map((slug) => (
                      <option key={slug} value={slug}>
                        {slug}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    SEO title
                  </span>
                  <input
                    type="text"
                    required
                    value={pageFormData.title}
                    onChange={(event) =>
                      setPageFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="form-input w-full rounded-2xl border-zinc-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Meta description
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={pageFormData.metaDescription}
                    onChange={(event) =>
                      setPageFormData((current) => ({
                        ...current,
                        metaDescription: event.target.value,
                      }))
                    }
                    className="form-textarea w-full rounded-2xl border-zinc-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Page content JSON
                  </span>
                  <textarea
                    required
                    rows={14}
                    value={pageFormData.contentInput}
                    onChange={(event) =>
                      setPageFormData((current) => ({
                        ...current,
                        contentInput: event.target.value,
                      }))
                    }
                    className="form-textarea w-full rounded-2xl border-zinc-200 font-mono text-xs leading-5"
                  />
                </label>

                <button
                  type="submit"
                  disabled={pageSaving}
                  className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pageSaving ? "Saving..." : "Update page"}
                </button>
              </div>
            </form>
          )}

          {activeSection === "newsletter" && (
            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                    Newsletter
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                    Subscriber list
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    These emails are collected from the footer form and stored
                    in Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportSubscribers}
                  disabled={subscribers.length === 0}
                  className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export CSV
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-100 p-4">
                  <p className="text-3xl font-semibold tracking-tight text-zinc-950">
                    {subscribers.filter((item) => item.status === "subscribed").length}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">Subscribed</p>
                </div>
                <div className="rounded-2xl bg-zinc-100 p-4">
                  <p className="text-3xl font-semibold tracking-tight text-zinc-950">
                    {subscribers.length}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">Total records</p>
                </div>
                <button
                  type="button"
                  onClick={refreshSubscribers}
                  className="rounded-2xl border border-zinc-200 p-4 text-left text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                >
                  Refresh subscribers
                </button>
              </div>

              <div className="mt-6 max-h-[34rem] space-y-3 overflow-auto pr-1">
                {subscribers.map((subscriber) => (
                  <article
                    key={subscriber.id}
                    className="rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold text-zinc-950">
                          {subscriber.email}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {subscriber.source ?? "site"} ·{" "}
                          {formatSubscriberDate(subscriber.created_at)}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-lime-300 px-2 py-1 text-xs font-semibold text-zinc-950">
                        {subscriber.status}
                      </span>
                    </div>
                  </article>
                ))}

                {subscribers.length === 0 && (
                  <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                    No subscribers yet. The footer newsletter form will fill
                    this list after the Supabase migration is applied.
                  </p>
                )}
              </div>
            </section>
          )}

          {activeSection === "affiliates" && (
            <section className="space-y-6 lg:col-span-2">
              <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
                      Affiliate tracking
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Programs, links, and click analytics
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
                      Use provider-neutral links, keep disclosures visible, and
                      track clicks without hiding affiliate relationships.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshAffiliateData}
                    className="w-fit rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-lime-300 hover:text-lime-300"
                  >
                    Refresh tracking
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {affiliateClicks.length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">Tracked clicks</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {affiliateLinks.filter((link) => link.active).length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">Active links</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {affiliatePrograms.filter((program) => program.status === "approved").length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">Approved programs</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {inactiveOrBrokenLinks.length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">Inactive or broken</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  onSubmit={handleAffiliateProgramSubmit}
                  className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                        Programs
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                        {editingAffiliateProgramId ? "Edit program" : "Add program"}
                      </h3>
                    </div>
                    {editingAffiliateProgramId && (
                      <button
                        type="button"
                        onClick={() => resetAffiliateProgramForm()}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Program name
                      </span>
                      <input
                        type="text"
                        required
                        value={affiliateProgramForm.name}
                        onChange={(event) =>
                          setAffiliateProgramForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="form-input w-full rounded-2xl border-zinc-200"
                        placeholder="Impact, Amazon, Shopify, Zebra"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Network
                        </span>
                        <select
                          value={affiliateProgramForm.network}
                          onChange={(event) =>
                            setAffiliateProgramForm((current) => ({
                              ...current,
                              network: event.target.value as AffiliateNetwork,
                            }))
                          }
                          className="form-select w-full rounded-2xl border-zinc-200"
                        >
                          {AFFILIATE_NETWORKS.map((network) => (
                            <option key={network} value={network}>
                              {formatOptionLabel(network)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Status
                        </span>
                        <select
                          value={affiliateProgramForm.status}
                          onChange={(event) =>
                            setAffiliateProgramForm((current) => ({
                              ...current,
                              status: event.target.value as AffiliateProgramStatus,
                            }))
                          }
                          className="form-select w-full rounded-2xl border-zinc-200"
                        >
                          {AFFILIATE_PROGRAM_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {formatOptionLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Commission summary
                        </span>
                        <input
                          type="text"
                          value={affiliateProgramForm.commissionSummary}
                          onChange={(event) =>
                            setAffiliateProgramForm((current) => ({
                              ...current,
                              commissionSummary: event.target.value,
                            }))
                          }
                          className="form-input w-full rounded-2xl border-zinc-200"
                          placeholder="Up to 20%, varies by product"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Cookie duration
                        </span>
                        <input
                          type="text"
                          value={affiliateProgramForm.cookieDuration}
                          onChange={(event) =>
                            setAffiliateProgramForm((current) => ({
                              ...current,
                              cookieDuration: event.target.value,
                            }))
                          }
                          className="form-input w-full rounded-2xl border-zinc-200"
                          placeholder="30 days"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Terms URL
                      </span>
                      <input
                        type="url"
                        value={affiliateProgramForm.termsUrl}
                        onChange={(event) =>
                          setAffiliateProgramForm((current) => ({
                            ...current,
                            termsUrl: event.target.value,
                          }))
                        }
                        className="form-input w-full rounded-2xl border-zinc-200"
                        placeholder="https://..."
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Approved at
                      </span>
                      <input
                        type="datetime-local"
                        value={affiliateProgramForm.approvedAt}
                        onChange={(event) =>
                          setAffiliateProgramForm((current) => ({
                            ...current,
                            approvedAt: event.target.value,
                          }))
                        }
                        className="form-input w-full rounded-2xl border-zinc-200"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Payout notes
                      </span>
                      <textarea
                        rows={3}
                        value={affiliateProgramForm.payoutNotes}
                        onChange={(event) =>
                          setAffiliateProgramForm((current) => ({
                            ...current,
                            payoutNotes: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Internal notes
                      </span>
                      <textarea
                        rows={3}
                        value={affiliateProgramForm.notes}
                        onChange={(event) =>
                          setAffiliateProgramForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={affiliateSaving}
                      className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {affiliateSaving
                        ? "Saving..."
                        : editingAffiliateProgramId
                          ? "Update program"
                          : "Create program"}
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={handleAffiliateLinkSubmit}
                  className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                        Links
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                        {editingAffiliateLinkId ? "Edit link" : "Add link"}
                      </h3>
                    </div>
                    {editingAffiliateLinkId && (
                      <button
                        type="button"
                        onClick={() => resetAffiliateLinkForm()}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Program
                      </span>
                      <select
                        required
                        value={affiliateLinkForm.programId || affiliatePrograms[0]?.id || ""}
                        onChange={(event) =>
                          setAffiliateLinkForm((current) => ({
                            ...current,
                            programId: event.target.value,
                          }))
                        }
                        className="form-select w-full rounded-2xl border-zinc-200"
                      >
                        {affiliatePrograms.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name} · {formatOptionLabel(program.status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Link slug
                        </span>
                        <input
                          type="text"
                          required
                          value={affiliateLinkForm.slug}
                          onChange={(event) =>
                            setAffiliateLinkForm((current) => ({
                              ...current,
                              slug: slugify(event.target.value),
                            }))
                          }
                          className="form-input w-full rounded-2xl border-zinc-200"
                          placeholder="shopify-pos"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Visible CTA label
                        </span>
                        <input
                          type="text"
                          required
                          value={affiliateLinkForm.label}
                          onChange={(event) =>
                            setAffiliateLinkForm((current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          className="form-input w-full rounded-2xl border-zinc-200"
                          placeholder="Check price"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Destination URL
                      </span>
                      <input
                        type="url"
                        required
                        value={affiliateLinkForm.destinationUrl}
                        onChange={(event) =>
                          setAffiliateLinkForm((current) => ({
                            ...current,
                            destinationUrl: event.target.value,
                          }))
                        }
                        className="form-input w-full rounded-2xl border-zinc-200"
                        placeholder="https://partner.example.com/..."
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={affiliateLinkForm.useRedirect}
                          onChange={(event) =>
                            setAffiliateLinkForm((current) => ({
                              ...current,
                              useRedirect: event.target.checked,
                            }))
                          }
                          className="rounded border-zinc-300 text-zinc-950"
                        />
                        <span className="text-sm font-semibold text-zinc-800">
                          Use /go redirect
                        </span>
                      </label>

                      <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={affiliateLinkForm.active}
                          onChange={(event) =>
                            setAffiliateLinkForm((current) => ({
                              ...current,
                              active: event.target.checked,
                            }))
                          }
                          className="rounded border-zinc-300 text-zinc-950"
                        />
                        <span className="text-sm font-semibold text-zinc-800">
                          Active
                        </span>
                      </label>

                      <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={affiliateLinkForm.disclosureRequired}
                          onChange={(event) =>
                            setAffiliateLinkForm((current) => ({
                              ...current,
                              disclosureRequired: event.target.checked,
                            }))
                          }
                          className="rounded border-zinc-300 text-zinc-950"
                        />
                        <span className="text-sm font-semibold text-zinc-800">
                          Disclosure
                        </span>
                      </label>
                    </div>

                    <div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">
                      Links always render with{" "}
                      <span className="font-mono text-zinc-950">
                        rel=&quot;sponsored nofollow&quot;
                      </span>{" "}
                      and open in a new tab. Disable redirects when a program
                      prohibits redirect links.
                    </div>

                    <button
                      type="submit"
                      disabled={affiliateSaving || affiliatePrograms.length === 0}
                      className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {affiliateSaving
                        ? "Saving..."
                        : editingAffiliateLinkId
                          ? "Update link"
                          : "Create link"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid gap-6 lg:grid-cols-4">
                <MetricList
                  title="Clicks by article"
                  rows={clicksByArticle}
                  emptyLabel="No article click data yet."
                />
                <MetricList
                  title="Clicks by program"
                  rows={clicksByProgram}
                  emptyLabel="No program click data yet."
                />
                <MetricList
                  title="Clicks by CTA placement"
                  rows={clicksByPlacement}
                  emptyLabel="No placement click data yet."
                />
                <MetricList
                  title="Top converting pages"
                  rows={clicksByArticle}
                  emptyLabel="No click proxy data yet."
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                  <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    Affiliate links
                  </h3>
                  <div className="mt-5 space-y-3">
                    {affiliateLinks.map((link) => {
                      const program = affiliatePrograms.find(
                        (item) => item.id === link.program_id,
                      );
                      const publicHref = link.use_redirect
                        ? `/go/${link.slug}`
                        : link.destination_url;

                      return (
                        <article
                          key={link.id}
                          className="rounded-2xl border border-zinc-200 p-4"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {program?.name ?? "Unknown program"}
                              </p>
                              <h4 className="mt-1 font-semibold text-zinc-950">
                                {link.label}
                              </h4>
                              <p className="mt-2 break-all font-mono text-xs text-zinc-500">
                                {publicHref}
                              </p>
                            </div>
                            <span
                              className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${
                                link.active
                                  ? "bg-lime-300 text-zinc-950"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {link.active ? "active" : "inactive"}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAffiliateLinkEdit(link)}
                              className="rounded-full border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                            >
                              Edit
                            </button>
                            <a
                              href={publicHref}
                              target="_blank"
                              rel="sponsored nofollow"
                              className="rounded-full border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                            >
                              Test link
                            </a>
                          </div>
                        </article>
                      );
                    })}

                    {affiliateLinks.length === 0 && (
                      <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                        No affiliate links yet. Create a program first, then add
                        a link for each product CTA.
                      </p>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                    <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">
                      Programs
                    </h3>
                    <div className="mt-5 space-y-3">
                      {affiliatePrograms.map((program) => (
                        <article
                          key={program.id}
                          className="rounded-2xl border border-zinc-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {formatOptionLabel(program.network)}
                              </p>
                              <h4 className="mt-1 font-semibold text-zinc-950">
                                {program.name}
                              </h4>
                              {program.commission_summary && (
                                <p className="mt-2 text-sm text-zinc-600">
                                  {program.commission_summary}
                                </p>
                              )}
                            </div>
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
                              {formatOptionLabel(program.status)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAffiliateProgramEdit(program)}
                            className="mt-4 rounded-full border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                          >
                            Edit
                          </button>
                        </article>
                      ))}

                      {affiliatePrograms.length === 0 && (
                        <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                          No affiliate programs yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                    <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">
                      Broken or inactive links
                    </h3>
                    <div className="mt-5 space-y-3">
                      {inactiveOrBrokenLinks.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => handleAffiliateLinkEdit(link)}
                          className="block w-full rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-sm text-red-700 transition hover:border-red-300"
                        >
                          <span className="block font-semibold">{link.label}</span>
                          <span className="mt-1 block break-all font-mono text-xs">
                            {link.destination_url || "Missing destination URL"}
                          </span>
                        </button>
                      ))}

                      {inactiveOrBrokenLinks.length === 0 && (
                        <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                          No inactive or missing-destination links found.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </section>
          )}

          <aside className="space-y-6">
            {activeSection === "articles" && (
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                      Live preview
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                      Article card
                    </h2>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    {formData.status}
                  </span>
                </div>

                <article className="mt-5 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50">
                  {formData.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.coverImageUrl}
                      alt={formData.coverImageAlt}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-end bg-[radial-gradient(circle_at_20%_20%,rgba(190,242,100,0.7),transparent_32%),linear-gradient(135deg,#18181b,#3f3f46)] p-5 text-white">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                        Devicefield
                      </p>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-sm font-semibold text-lime-700">
                      {formData.category}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                      {seoTitle || "Article title preview"}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-zinc-600">
                      {metaDescription || "The article meta description will appear here."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {splitList(formData.tagsInput)
                        .slice(0, 4)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </article>
              </div>
            )}

            {activeSection === "pages" && (
              <>
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                    Live preview
                  </p>
                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50">
                    <div className="bg-zinc-950 p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">
                        {getPreviewString(
                          pagePreviewContent,
                          "eyebrow",
                          getPreviewString(activePageDefaults, "eyebrow", "Page"),
                        )}
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                        {getPreviewString(
                          pagePreviewContent,
                          "heading",
                          getPreviewString(
                            activePageDefaults,
                            "heading",
                            pageFormData.title,
                          ),
                        )}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {getPreviewString(
                          pagePreviewContent,
                          "intro",
                          getPreviewString(
                            activePageDefaults,
                            "intro",
                            pageFormData.metaDescription,
                          ),
                        )}
                      </p>
                    </div>
                    <div className="p-5">
                      {pageFormData.slug === "home" && (
                        <div className="grid grid-cols-2 gap-2">
                          {getPreviewList(
                            pagePreviewContent,
                            "focusAreas",
                            getPreviewList(activePageDefaults, "focusAreas", []),
                          ).map((area) => (
                            <span
                              key={area}
                              className="rounded-2xl bg-white px-3 py-4 text-sm font-semibold text-zinc-800"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      {pageFormData.slug === "blog" && (
                        <div className="space-y-3">
                          {BLOG_CATEGORIES.slice(0, 4).map((category) => (
                            <div
                              key={category}
                              className="rounded-2xl bg-white p-4"
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                Category
                              </p>
                              <p className="mt-1 font-semibold text-zinc-950">
                                {category}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {pageFormData.slug === "terms" && (
                        <div className="space-y-3">
                          <div className="rounded-2xl bg-white p-4">
                            <p className="font-semibold text-zinc-950">
                              Affiliate disclosure
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                              Terms sections render as policy cards on the public
                              page.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    Pages
                  </h2>
                  <div className="mt-5 space-y-3">
                    {pages.map((page) => (
                      <button
                        key={page.slug}
                        type="button"
                        onClick={() => handlePageEdit(page.slug)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          pageFormData.slug === page.slug
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 hover:border-zinc-950"
                        }`}
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
                          /{page.slug === "home" ? "" : page.slug}
                        </span>
                        <span className="mt-1 block font-semibold">
                          {page.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeSection === "newsletter" && (
              <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">
                  Free workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Send manually at first
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Export the CSV, import contacts into Google Contacts or a
                  Workspace group, then send low-volume updates from
                  contact@devicefield.com. Upgrade to a sender platform later
                  when the list is large enough to justify it.
                </p>
              </div>
            )}

            {activeSection === "articles" && (
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  SEO readiness
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-lime-400 transition-all"
                    style={{ width: `${estimatedSeoScore}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-700">
                  {estimatedSeoScore}/100
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                  {seoChecks.map((check) => (
                    <li
                      key={check.label}
                      className={check.passed ? "text-zinc-700" : "text-red-600"}
                    >
                      {check.passed ? "Pass" : "Fix"}: {check.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">
                  <p>Words: {wordCount}</p>
                  <p>H2 sections: {h2Count}</p>
                  <p>Internal links: {internalLinks.length}</p>
                  <p>Dofollow external links: {dofollowExternalLinks.length}</p>
                  <p>Body images: {bodyImages.length}</p>
                </div>
              </div>
            )}

            {activeSection === "articles" && (
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  Articles
                </h2>
                <div className="mt-5 space-y-3">
                  {posts.map((post) => (
                    <article key={post.id} className="rounded-2xl border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {post.status}
                          </p>
                          <h3 className="mt-1 font-semibold leading-6 text-zinc-950">
                            {post.title}
                          </h3>
                        </div>
                        {post.featured && (
                          <span className="rounded-full bg-lime-300 px-2 py-1 text-xs font-semibold text-zinc-950">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(post)}
                          className="rounded-full border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                        >
                          Edit
                        </button>
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            className="rounded-full border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}

                  {posts.length === 0 && (
                    <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                      No database articles yet. Create the first post after
                      running the blog SQL setup in Supabase.
                    </p>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
