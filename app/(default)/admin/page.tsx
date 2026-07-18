"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingAnimation from "@/components/loading-animation";
import { createClient } from "@/lib/supabase/client";
import {
  AFFILIATE_NETWORKS,
  AFFILIATE_PROGRAM_STATUSES,
  ARTICLE_PRODUCT_PLACEMENTS,
  type AffiliateClickEvent,
  type AffiliateLink,
  type AffiliateNetwork,
  type AffiliateProgram,
  type AffiliateProgramStatus,
  type AffiliateSuggestionReviewStatus,
  type ArticleAffiliateSuggestion,
  type ArticleProduct,
  type ArticleProductPlacement,
} from "@/lib/affiliate/types";
import {
  ARTICLE_TYPES,
  TESTING_STATUSES,
  BLOG_CATEGORIES,
  formatWorkflowStatus,
  slugify,
  type ArticleType,
  type ArticleCoverImage,
  type ArticleWorkflowStatus,
  type Author,
  type BlogPost,
  type TestingStatus,
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
  coverImageUrl: string;
  coverImageAlt: string;
  canonicalUrl: string;
  faqInput: string;
  articleType: ArticleType;
  testingStatus: TestingStatus | "";
  workflowStatus: ArticleWorkflowStatus;
  authorId: string;
  reviewerId: string;
  reviewedAt: string;
  lastReviewedAt: string;
  lastVerifiedAt: string;
  nextReviewAt: string;
  sourcesInput: string;
  claimsInput: string;
  quickVerdict: string;
  bestFor: string;
  avoidIf: string;
  compatibilityNotes: string;
  limitations: string;
  testingMethod: string;
  originalEvidenceInput: string;
  scheduledFor: string;
  internalNotes: string;
  featured: boolean;
};

type ArticleWorkflowAction =
  | "save_draft"
  | "mark_ready"
  | "return_to_draft"
  | "approve"
  | "schedule"
  | "unschedule"
  | "publish"
  | "unpublish"
  | "archive";

type AuthorForm = {
  name: string;
  slug: string;
  jobTitle: string;
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
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

type ArticleProductForm = {
  affiliateLinkId: string;
  productName: string;
  award: string;
  bestFor: string;
  avoidIf: string;
  verdict: string;
  prosInput: string;
  consInput: string;
  placement: ArticleProductPlacement;
  displayOrder: string;
};

type AdminSection =
  | "articles"
  | "pages"
  | "people"
  | "newsletter"
  | "affiliates";

type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string | null;
  status: "pending" | "subscribed" | "unsubscribed";
  created_at: string;
  confirmed_at: string | null;
  provider_synced_at: string | null;
};

type AdminAffiliateClick = AffiliateClickEvent & {
  affiliate_links?:
    | (Pick<AffiliateLink, "id" | "label" | "slug" | "program_id"> & {
        affiliate_programs?: Pick<
          AffiliateProgram,
          "id" | "name" | "network" | "status"
        > | null;
      })
    | null;
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
  affiliate_programs?:
    | AffiliateProgramSummary
    | AffiliateProgramSummary[]
    | null;
};

type AdminAffiliateClickRaw = AffiliateClickEvent & {
  affiliate_links?: AffiliateLinkSummary | AffiliateLinkSummary[] | null;
  blog_posts?:
    | Pick<BlogPost, "id" | "title" | "slug">
    | Array<Pick<BlogPost, "id" | "title" | "slug">>
    | null;
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
  coverImageUrl: "",
  coverImageAlt: "",
  canonicalUrl: "",
  faqInput: "",
  articleType: "buying_guide",
  testingStatus: "",
  workflowStatus: "draft",
  authorId: "",
  reviewerId: "",
  reviewedAt: "",
  lastReviewedAt: "",
  lastVerifiedAt: "",
  nextReviewAt: "",
  sourcesInput: "[]",
  claimsInput: "[]",
  quickVerdict: "",
  bestFor: "",
  avoidIf: "",
  compatibilityNotes: "",
  limitations: "",
  testingMethod: "",
  originalEvidenceInput: "[]",
  scheduledFor: "",
  internalNotes: "",
  featured: false,
};

const emptyAuthorForm: AuthorForm = {
  name: "",
  slug: "",
  jobTitle: "",
  bio: "",
  avatarUrl: "",
  websiteUrl: "",
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
const emptyArticleProductForm: ArticleProductForm = {
  affiliateLinkId: "",
  productName: "",
  award: "",
  bestFor: "",
  avoidIf: "",
  verdict: "",
  prosInput: "",
  consInput: "",
  placement: "recommendation",
  displayOrder: "0",
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

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function countH2Headings(value: string) {
  return (value.match(/^##\s+/gm) ?? []).length;
}

function getMarkdownLinks(value: string) {
  return Array.from(
    value.matchAll(
      /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)(\{sponsored\})?/g,
    ),
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

function countUnresolvedClaims(value: string) {
  return (
    value.match(
      /\b(?:todo|tbd|tk|needs? source|verify this)\b|\[citation needed\]/gi,
    ) ?? []
  ).length;
}

function isWithinDays(value: Date | null, days: number) {
  if (!value) return false;
  const age = Date.now() - value.getTime();
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
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

function safeParseArray(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function toIsoOrNull(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getPreviewString(
  content: Record<string, unknown> | null,
  key: string,
  fallback: string,
) {
  const value = content?.[key];
  return typeof value === "string" ? value : fallback;
}

function getPreviewSections(content: Record<string, unknown> | null) {
  const sections = content?.sections;
  if (!Array.isArray(sections)) return [];
  return sections.filter(
    (section): section is { title: string; body: string } =>
      Boolean(
        section &&
        typeof section === "object" &&
        typeof (section as { title?: unknown }).title === "string" &&
        typeof (section as { body?: unknown }).body === "string",
      ),
  );
}

function getPreviewCategoryEntries(
  content: Record<string, unknown> | null,
  fallback: unknown,
) {
  const value = content?.categoryEntries;
  const entries = Array.isArray(value)
    ? value
    : Array.isArray(fallback)
      ? fallback
      : [];

  return entries.filter(
    (entry): entry is { title: string; description: string } =>
      Boolean(
        entry &&
        typeof entry === "object" &&
        typeof (entry as { title?: unknown }).title === "string" &&
        typeof (entry as { description?: unknown }).description === "string",
      ),
  );
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
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
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
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
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
              <p className="text-sm font-semibold text-zinc-800">{row.label}</p>
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

function AffiliateSuggestionCard({
  suggestion,
  articleTitle,
  saving,
  onOpenArticle,
  onStatusChange,
}: {
  suggestion: ArticleAffiliateSuggestion;
  articleTitle?: string;
  saving: boolean;
  onOpenArticle?: () => void;
  onStatusChange: (status: AffiliateSuggestionReviewStatus) => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {formatOptionLabel(suggestion.network)} · {articleTitle ?? "Current article"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-950">
            {suggestion.program_name}
          </h3>
          {suggestion.product_name && (
            <p className="mt-1 text-sm text-zinc-600">
              {suggestion.product_name}
            </p>
          )}
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            suggestion.review_status === "shortlisted"
              ? "bg-lime-200 text-zinc-950"
              : suggestion.review_status === "dismissed"
                ? "bg-zinc-100 text-zinc-500"
                : "bg-amber-100 text-amber-900"
          }`}
        >
          {formatOptionLabel(suggestion.review_status)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-950 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">
          Suggested placement
        </p>
        <p className="mt-2 font-semibold">{suggestion.target_heading}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {formatOptionLabel(suggestion.suggested_placement)}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {suggestion.insertion_note}
        </p>
        {suggestion.suggested_cta && (
          <p className="mt-3 text-sm text-lime-200">
            Suggested CTA: {suggestion.suggested_cta}
          </p>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-600">
        {suggestion.rationale}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <a
          href={suggestion.program_url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-zinc-300 px-3 py-2 text-zinc-700 hover:border-zinc-950"
        >
          Program page
        </a>
        <a
          href={suggestion.evidence_url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-zinc-300 px-3 py-2 text-zinc-700 hover:border-zinc-950"
        >
          Research evidence
        </a>
        <span className="rounded-full bg-zinc-100 px-3 py-2 text-zinc-500">
          Checked {new Date(suggestion.evidence_checked_at).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        {onOpenArticle && (
          <button
            type="button"
            onClick={onOpenArticle}
            className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-950"
          >
            Open article
          </button>
        )}
        <button
          type="button"
          disabled={saving || suggestion.review_status === "shortlisted"}
          onClick={() => onStatusChange("shortlisted")}
          className="rounded-full bg-zinc-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          Shortlist
        </button>
        <button
          type="button"
          disabled={saving || suggestion.review_status === "dismissed"}
          onClick={() => onStatusChange("dismissed")}
          className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"
        >
          Dismiss
        </button>
        {suggestion.review_status !== "pending" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onStatusChange("pending")}
            className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40"
          >
            Reset to pending
          </button>
        )}
      </div>
    </article>
  );
}

function WorkflowButton({
  label,
  disabled,
  onClick,
  tone = "default",
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-full px-4 py-2 text-sm font-semibold sm:w-auto disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border border-red-200 bg-red-50 text-red-700"
          : "bg-zinc-950 text-white"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [pages, setPages] = useState<SitePage[]>(defaultPages);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<
    AffiliateProgram[]
  >([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [affiliateClicks, setAffiliateClicks] = useState<AdminAffiliateClick[]>(
    [],
  );
  const [articleProducts, setArticleProducts] = useState<ArticleProduct[]>([]);
  const [articleCoverImages, setArticleCoverImages] = useState<
    ArticleCoverImage[]
  >([]);
  const [articleAffiliateSuggestions, setArticleAffiliateSuggestions] =
    useState<ArticleAffiliateSuggestion[]>([]);
  const [activeSection, setActiveSection] = useState<AdminSection>("articles");
  const [formData, setFormData] = useState<BlogPostForm>(emptyForm);
  const [pageFormData, setPageFormData] = useState<SitePageForm>(emptyPageForm);
  const [affiliateProgramForm, setAffiliateProgramForm] =
    useState<AffiliateProgramForm>(emptyAffiliateProgramForm);
  const [affiliateLinkForm, setAffiliateLinkForm] = useState<AffiliateLinkForm>(
    emptyAffiliateLinkForm,
  );
  const [articleProductForm, setArticleProductForm] =
    useState<ArticleProductForm>(emptyArticleProductForm);
  const [authorForm, setAuthorForm] = useState<AuthorForm>(emptyAuthorForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAffiliateProgramId, setEditingAffiliateProgramId] = useState<
    string | null
  >(null);
  const [editingAffiliateLinkId, setEditingAffiliateLinkId] = useState<
    string | null
  >(null);
  const [editingArticleProductId, setEditingArticleProductId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageSaving, setPageSaving] = useState(false);
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [articleProductSaving, setArticleProductSaving] = useState(false);
  const [affiliateSuggestionSavingId, setAffiliateSuggestionSavingId] =
    useState<string | null>(null);
  const [authorSaving, setAuthorSaving] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverImageSelectingId, setCoverImageSelectingId] = useState<
    string | null
  >(null);
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
            click.affiliate_links?.affiliate_programs?.name ??
            "Unknown program",
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
  const selectedAffiliateProgram = useMemo(
    () =>
      affiliatePrograms.find(
        (program) => program.id === affiliateLinkForm.programId,
      ) ?? affiliatePrograms[0] ?? null,
    [affiliateLinkForm.programId, affiliatePrograms],
  );
  const currentArticleProducts = useMemo(
    () =>
      articleProducts
        .filter((product) => product.article_id === editingId)
        .sort((left, right) => left.display_order - right.display_order),
    [articleProducts, editingId],
  );
  const currentCoverImages = useMemo(
    () =>
      articleCoverImages
        .filter((image) => image.article_id === editingId)
        .sort((left, right) => left.display_order - right.display_order),
    [articleCoverImages, editingId],
  );
  const currentAffiliateSuggestions = useMemo(
    () =>
      articleAffiliateSuggestions
        .filter((suggestion) => suggestion.article_id === editingId)
        .sort((left, right) => left.display_order - right.display_order),
    [articleAffiliateSuggestions, editingId],
  );
  const pendingAffiliateSuggestions = useMemo(
    () =>
      articleAffiliateSuggestions.filter(
        (suggestion) => suggestion.review_status === "pending",
      ),
    [articleAffiliateSuggestions],
  );
  const reviewPosts = posts.filter(
    (post) => post.workflow_status === "ready_for_review",
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
  const testingStatus = formData.testingStatus || null;
  const parsedSources = safeParseArray(formData.sourcesInput);
  const parsedClaims = safeParseArray(formData.claimsInput);
  const parsedEvidence = safeParseArray(formData.originalEvidenceInput);
  const unresolvedTextClaims = countUnresolvedClaims(formData.content);
  const unresolvedStructuredClaims = (parsedClaims ?? []).filter((claim) => {
    if (!claim || typeof claim !== "object") return true;
    const row = claim as { risk?: unknown; resolved?: unknown };
    return row.risk === "high" && row.resolved !== true;
  }).length;
  const unresolvedClaimCount =
    unresolvedTextClaims + unresolvedStructuredClaims;
  const hasReviewer = formData.reviewerId.length > 0;
  const hasSources = (parsedSources?.length ?? 0) > 0;
  const hasNumericalClaims =
    /(?:[$£€]\s?\d|\b\d+(?:\.\d+)?(?:%|\s?(?:hours?|days?|users?|devices?|times?|x))\b)/i.test(
      formData.content,
    );
  const hasAffiliateReferences =
    currentArticleProducts.some((product) => product.affiliate_link_id) ||
    links.some((link) => link.sponsored);
  const hasCommercialClaims =
    hasAffiliateReferences ||
    /\b(?:price|pricing|cost|discount|deal|subscription|per month|per year)\b/i.test(
      formData.content,
    );
  const commercialVerificationDate = formData.lastVerifiedAt
    ? new Date(formData.lastVerifiedAt)
    : null;
  const requiresSelectionCriteria = /\bbest\b/i.test(
    `${formData.title} ${seoTitle}`,
  );
  const hasSelectionCriteria =
    formData.testingMethod.trim().length > 0 ||
    /^##\s+(?:how we chose|selection criteria|what we evaluated|how we evaluated)\b/im.test(
      formData.content,
    );
  const claimsHandsOnTesting =
    testingStatus !== null && normalizeText(testingStatus) !== "researched";
  const hasOriginalEvidence =
    (parsedEvidence?.length ?? 0) > 0 || bodyImages.length > 0;
  const requiredChecks = [
    {
      label: "Important factual claims have sources.",
      passed: hasSources,
      detail: `${parsedSources?.length ?? 0} structured sources added.`,
    },
    {
      label: "All numerical claims have sources.",
      passed: !hasNumericalClaims || hasSources,
      detail: hasNumericalClaims
        ? "Numerical claims were detected; verify each against a structured source."
        : "No obvious numerical claims were detected.",
    },
    {
      label: "Commercial claims were recently verified.",
      passed:
        !hasCommercialClaims || isWithinDays(commercialVerificationDate, 180),
      detail: hasCommercialClaims
        ? "Set Last verified after rechecking current pricing, availability, and terms."
        : "No obvious commercial claims were detected.",
    },
    {
      label: "Testing status is selected.",
      passed: testingStatus !== null,
      detail: "Choose Tested, Researched, or Mixed.",
    },
    {
      label: "Reviewer is assigned.",
      passed: hasReviewer,
      detail: "Select an author profile as reviewer.",
    },
    {
      label: "Affiliate disclosure is present when required.",
      passed: true,
      detail: hasAffiliateReferences
        ? "The article template will show the disclosure automatically."
        : "No structured or sponsored affiliate links currently require it.",
    },
    {
      label: "Unresolved high-risk claims are zero.",
      passed: unresolvedClaimCount === 0,
      detail: `${unresolvedClaimCount} unresolved high-risk or placeholder claims found.`,
    },
    {
      label: "Original evidence supports hands-on testing claims.",
      passed: !claimsHandsOnTesting || hasOriginalEvidence,
      detail: claimsHandsOnTesting
        ? "Add original evidence records or article images with testing notes."
        : "Researched articles do not need to imply hands-on evidence.",
    },
    {
      label: "‘Best’ recommendations explain selection criteria.",
      passed: !requiresSelectionCriteria || hasSelectionCriteria,
      detail: requiresSelectionCriteria
        ? "Document the selection criteria in Testing method or the article body."
        : "The title does not make a ‘best’ claim.",
    },
  ];
  const recommendedChecks = [
    {
      label: "SEO title and description are concise.",
      passed:
        seoTitle.length >= 35 &&
        seoTitle.length <= 70 &&
        metaDescription.length >= 120 &&
        metaDescription.length <= 160,
      detail: `${seoTitle.length}/70 title characters; ${metaDescription.length}/160 description characters.`,
    },
    {
      label: "Slug is short and descriptive.",
      passed: formData.slug.length > 0 && formData.slug.length <= 60,
      detail: `${formData.slug.length}/60 characters.`,
    },
    {
      label: "Article has useful structure and internal links.",
      passed: h2Count >= 2 && internalLinks.length > 0,
      detail: `${h2Count} H2 sections; ${internalLinks.length} internal links.`,
    },
    {
      label: "Images use descriptive alt text.",
      passed:
        (!formData.coverImageUrl.trim() ||
          formData.coverImageAlt.trim().length >= 8) &&
        bodyImages.every((image) => image.alt.trim().length >= 8),
      detail: `${bodyImages.length} body images found.`,
    },
  ];
  const humanJudgmentChecks = [
    {
      label: "The recommendation matches the stated business use case.",
      passed: formData.quickVerdict.trim().length > 0,
      detail:
        "Review fit, tradeoffs, alternatives, and the quick verdict manually.",
    },
    {
      label: "Compatibility and limitations are explicit.",
      passed:
        formData.compatibilityNotes.trim().length > 0 &&
        formData.limitations.trim().length > 0,
      detail: "Confirm important dependencies and what could not be verified.",
    },
    {
      label: "Sources are current and authoritative.",
      passed: hasSources,
      detail: "A human reviewer must verify source quality and recency.",
    },
  ];

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

    const fetchAuthors = async () => {
      const { data, error } = await supabase
        .from("authors")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(`Unable to load author profiles. ${error.message}`);
      } else {
        setAuthors((data ?? []) as Author[]);
      }
    };

    const fetchCoverImages = async () => {
      const { data, error } = await supabase
        .from("article_cover_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        setErrorMessage(
          `Unable to load article cover options. Run the latest Supabase migration first. ${error.message}`,
        );
      } else {
        setArticleCoverImages((data ?? []) as ArticleCoverImage[]);
      }
    };

    const fetchSubscribers = async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select(
          "id,email,source,status,created_at,confirmed_at,provider_synced_at",
        )
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
      const [
        programsResult,
        linksResult,
        clicksResult,
        productsResult,
        suggestionsResult,
      ] =
        await Promise.all([
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
          supabase
            .from("article_products")
            .select("*")
            .order("display_order", { ascending: true }),
          supabase
            .from("article_affiliate_suggestions")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (programsResult.error) {
        setErrorMessage(
          `Unable to load affiliate programs. ${programsResult.error.message}`,
        );
      } else {
        setAffiliatePrograms((programsResult.data ?? []) as AffiliateProgram[]);
      }

      if (linksResult.error) {
        setErrorMessage(
          `Unable to load affiliate links. ${linksResult.error.message}`,
        );
      } else {
        setAffiliateLinks((linksResult.data ?? []) as AffiliateLink[]);
      }

      if (clicksResult.error) {
        setErrorMessage(
          `Unable to load affiliate clicks. ${clicksResult.error.message}`,
        );
      } else {
        setAffiliateClicks(
          normalizeAffiliateClicks(
            (clicksResult.data ?? []) as unknown as AdminAffiliateClickRaw[],
          ),
        );
      }

      if (productsResult.error) {
        setErrorMessage(
          `Unable to load article products. Run the latest Supabase migration first. ${productsResult.error.message}`,
        );
      } else {
        setArticleProducts((productsResult.data ?? []) as ArticleProduct[]);
      }

      if (suggestionsResult.error) {
        setErrorMessage(
          `Unable to load affiliate suggestions. Run the latest Supabase migration first. ${suggestionsResult.error.message}`,
        );
      } else {
        setArticleAffiliateSuggestions(
          (suggestionsResult.data ?? []) as ArticleAffiliateSuggestion[],
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
        fetchAuthors(),
        fetchCoverImages(),
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

  const refreshAuthors = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("authors")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setAuthors((data ?? []) as Author[]);
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
      .select(
        "id,email,source,status,created_at,confirmed_at,provider_synced_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSubscribers((data ?? []) as NewsletterSubscriber[]);
  };

  const refreshAffiliateData = async () => {
    const supabase = createClient();
    const [
      programsResult,
      linksResult,
      clicksResult,
      productsResult,
      suggestionsResult,
    ] =
      await Promise.all([
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
        supabase
          .from("article_products")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase
          .from("article_affiliate_suggestions")
          .select("*")
          .order("created_at", { ascending: false }),
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

    if (productsResult.error) {
      setErrorMessage(productsResult.error.message);
    } else {
      setArticleProducts((productsResult.data ?? []) as ArticleProduct[]);
    }

    if (suggestionsResult.error) {
      setErrorMessage(suggestionsResult.error.message);
    } else {
      setArticleAffiliateSuggestions(
        (suggestionsResult.data ?? []) as ArticleAffiliateSuggestion[],
      );
    }
  };

  const resetForm = (clearMessages = true) => {
    setEditingId(null);
    setFormData(emptyForm);
    setEditingArticleProductId(null);
    setArticleProductForm(emptyArticleProductForm);
    if (clearMessages) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handlePageEdit = (slug: SitePageSlug) => {
    const page =
      pages.find((current) => current.slug === slug) ?? defaultSitePages[slug];
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
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload cover image.",
      );
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverImageSelect = async (coverImage: ArticleCoverImage) => {
    if (!editingId || coverImage.article_id !== editingId) return;
    if (formData.workflowStatus === "published") {
      setErrorMessage(
        "Unpublish this article to draft before changing its cover image.",
      );
      return;
    }

    setCoverImageSelectingId(coverImage.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("select_article_cover_image", {
      p_article_id: editingId,
      p_cover_image_id: coverImage.id,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      const selected = Array.isArray(data) ? data[0] : data;
      const imageUrl = selected?.image_url ?? coverImage.image_url;
      const imageAlt = selected?.image_alt ?? coverImage.image_alt;
      setArticleCoverImages((current) =>
        current.map((image) =>
          image.article_id === editingId
            ? { ...image, selected: image.id === coverImage.id }
            : image,
        ),
      );
      setPosts((current) =>
        current.map((post) =>
          post.id === editingId
            ? {
                ...post,
                cover_image_url: imageUrl,
                cover_image_alt: imageAlt,
              }
            : post,
        ),
      );
      setFormData((current) => ({
        ...current,
        coverImageUrl: imageUrl,
        coverImageAlt: imageAlt,
      }));
      setSuccessMessage(`Selected ${coverImage.label} as the article cover.`);
    }

    setCoverImageSelectingId(null);
  };

  const handleBodyImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const alt = bodyImageAlt.trim();
    if (alt.length < 8) {
      setErrorMessage(
        "Enter descriptive alt text of at least 8 characters before uploading an inline image.",
      );
      return;
    }

    setBodyImageUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const publicUrl = await uploadArticleImage(file, "body");
      const markdown = `![${alt}](${publicUrl})`;
      setFormData((current) => ({
        ...current,
        content: `${current.content.trimEnd()}\n\n${markdown}\n\n`,
      }));
      setBodyImageAlt("");
      setSuccessMessage("Image uploaded and inserted into the article body.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload article image.",
      );
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
      coverImageUrl: post.cover_image_url ?? "",
      coverImageAlt: post.cover_image_alt ?? post.title,
      canonicalUrl: post.canonical_url ?? "",
      faqInput: formatFaqInput(post.faq_items),
      articleType: post.article_type,
      testingStatus: post.testing_status ?? "",
      workflowStatus: post.workflow_status,
      authorId: post.author_id ?? "",
      reviewerId: post.reviewer_id ?? "",
      reviewedAt: toDatetimeLocal(post.reviewed_at),
      lastReviewedAt: toDatetimeLocal(post.last_reviewed_at),
      lastVerifiedAt: toDatetimeLocal(post.last_verified_at),
      nextReviewAt: toDatetimeLocal(post.next_review_at),
      sourcesInput: JSON.stringify(post.sources ?? [], null, 2),
      claimsInput: JSON.stringify(post.claims ?? [], null, 2),
      quickVerdict: post.quick_verdict?.verdict ?? "",
      bestFor: post.quick_verdict?.best_for ?? "",
      avoidIf: post.quick_verdict?.avoid_if ?? "",
      compatibilityNotes: post.compatibility_notes ?? "",
      limitations: post.limitations ?? "",
      testingMethod: post.testing_method ?? "",
      originalEvidenceInput: JSON.stringify(
        post.original_evidence ?? [],
        null,
        2,
      ),
      scheduledFor: toDatetimeLocal(post.scheduled_for),
      internalNotes: post.internal_notes ?? "",
      featured: post.featured,
    });
    setActiveSection("articles");
    setEditingArticleProductId(null);
    setArticleProductForm({
      ...emptyArticleProductForm,
      affiliateLinkId: affiliateLinks.find((link) => link.active)?.id ?? "",
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persistArticle = async (
    action: ArticleWorkflowAction,
    scheduledFor: string | null,
  ) => {
    setSaving(true);
    setErrorMessage(null);

    const sources = safeParseArray(formData.sourcesInput);
    const claims = safeParseArray(formData.claimsInput);
    const originalEvidence = safeParseArray(formData.originalEvidenceInput);
    if (!sources || !claims || !originalEvidence) {
      setErrorMessage(
        "Sources, claims, and original evidence must each be valid JSON arrays.",
      );
      setSaving(false);
      return null;
    }

    const slug = slugify(formData.slug || formData.title);
    const payload = {
      title: formData.title.trim(),
      slug,
      excerpt: formData.excerpt.trim(),
      focus_keyword: formData.focusKeyword.trim() || null,
      seo_title: formData.seoTitle.trim() || formData.title.trim(),
      meta_description:
        formData.metaDescription.trim() || formData.excerpt.trim(),
      content: formData.content.trim(),
      category: formData.category,
      tags: splitList(formData.tagsInput),
      cover_image_url: formData.coverImageUrl.trim() || null,
      cover_image_alt: formData.coverImageAlt.trim() || null,
      canonical_url: formData.canonicalUrl.trim() || null,
      faq_items: parseFaqInput(formData.faqInput),
      article_type: formData.articleType,
      testing_status: formData.testingStatus || null,
      author_id: formData.authorId || null,
      reviewer_id: formData.reviewerId || null,
      reviewed_at: toIsoOrNull(formData.reviewedAt),
      last_reviewed_at: toIsoOrNull(formData.lastReviewedAt),
      last_verified_at: toIsoOrNull(formData.lastVerifiedAt),
      next_review_at: toIsoOrNull(formData.nextReviewAt),
      sources,
      claims,
      quick_verdict: {
        verdict: formData.quickVerdict.trim() || undefined,
        best_for: formData.bestFor.trim() || undefined,
        avoid_if: formData.avoidIf.trim() || undefined,
      },
      compatibility_notes: formData.compatibilityNotes.trim() || null,
      limitations: formData.limitations.trim() || null,
      testing_method: formData.testingMethod.trim() || null,
      original_evidence: originalEvidence,
      internal_notes: formData.internalNotes.trim() || null,
      featured: formData.featured,
    };
    const previousPost = posts.find((post) => post.id === editingId);

    try {
      const response = await fetch("/api/admin/articles/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: editingId,
          article: payload,
          action,
          scheduledFor,
          previousSlug: previousPost?.slug ?? null,
          previousCategory: previousPost?.category ?? null,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { article?: BlogPost; error?: string }
        | null;

      if (response.status === 401) {
        router.push("/devicefield-editor-login");
        return null;
      }

      if (!response.ok || !result?.article) {
        setErrorMessage(result?.error ?? "Unable to save the article.");
        return null;
      }

      setEditingId(result.article.id);
      return result.article;
    } catch {
      setErrorMessage("Unable to reach the article publishing service.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleWorkflowAction("save_draft");
  };

  const handleWorkflowAction = async (action: ArticleWorkflowAction) => {
    setWorkflowSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const scheduledFor =
      action === "schedule" ? toIsoOrNull(formData.scheduledFor) : null;
    if (action === "schedule" && !scheduledFor) {
      setErrorMessage("Choose a valid future schedule date and time.");
      setWorkflowSaving(false);
      return;
    }

    if (
      formData.workflowStatus === "published" &&
      !["unpublish", "archive"].includes(action)
    ) {
      setErrorMessage(
        "Unpublish this article to draft before editing or changing its review state.",
      );
      setWorkflowSaving(false);
      return;
    }

    if (
      action === "unpublish" &&
      !window.confirm(
        "Unpublish this article? It will be removed from the public site until it is reviewed and published again.",
      )
    ) {
      setWorkflowSaving(false);
      return;
    }

    const article = await persistArticle(action, scheduledFor);
    if (!article) {
      setWorkflowSaving(false);
      return;
    }

    setFormData((current) => ({
      ...current,
      workflowStatus: article.workflow_status,
      reviewedAt: toDatetimeLocal(article.reviewed_at),
      lastReviewedAt: toDatetimeLocal(article.last_reviewed_at),
      scheduledFor: toDatetimeLocal(article.scheduled_for),
    }));
    setSuccessMessage(
      `Workflow updated: ${formatWorkflowStatus(article.workflow_status)}.`,
    );
    await refreshPosts();
    setWorkflowSaving(false);
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

  const handleAuthorSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAuthorSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("authors").insert({
      name: authorForm.name.trim(),
      slug: slugify(authorForm.slug || authorForm.name),
      job_title: authorForm.jobTitle.trim() || null,
      bio: authorForm.bio.trim() || null,
      avatar_url: authorForm.avatarUrl.trim() || null,
      website_url: authorForm.websiteUrl.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setAuthorForm(emptyAuthorForm);
      setSuccessMessage("Author profile created.");
      await refreshAuthors();
    }
    setAuthorSaving(false);
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

    const program = affiliatePrograms.find((item) => item.id === programId);
    if (affiliateLinkForm.active && program?.status !== "approved") {
      setErrorMessage(
        "A link can be activated only after its affiliate program is approved.",
      );
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

  const resetArticleProductForm = (clearMessages = true) => {
    setEditingArticleProductId(null);
    setArticleProductForm({
      ...emptyArticleProductForm,
      affiliateLinkId: affiliateLinks.find((link) => link.active)?.id ?? "",
    });
    if (clearMessages) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handleArticleProductEdit = (product: ArticleProduct) => {
    setEditingArticleProductId(product.id);
    setArticleProductForm({
      affiliateLinkId: product.affiliate_link_id ?? "",
      productName: product.product_name,
      award: product.award ?? "",
      bestFor: product.best_for ?? "",
      avoidIf: product.avoid_if ?? "",
      verdict: product.verdict ?? "",
      prosInput: product.pros.join(", "),
      consInput: product.cons.join(", "),
      placement: product.placement,
      displayOrder: String(product.display_order),
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleArticleProductSave = async () => {
    if (!editingId) {
      setErrorMessage(
        "Save the article before adding product recommendations.",
      );
      return;
    }

    if (formData.workflowStatus === "published") {
      setErrorMessage(
        "Unpublish this article to draft before changing its product recommendations.",
      );
      return;
    }

    if (!articleProductForm.productName.trim()) {
      setErrorMessage("Enter a product name.");
      return;
    }

    setArticleProductSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      article_id: editingId,
      affiliate_link_id: articleProductForm.affiliateLinkId || null,
      product_name: articleProductForm.productName.trim(),
      award: articleProductForm.award.trim() || null,
      best_for: articleProductForm.bestFor.trim() || null,
      avoid_if: articleProductForm.avoidIf.trim() || null,
      verdict: articleProductForm.verdict.trim() || null,
      pros: splitList(articleProductForm.prosInput),
      cons: splitList(articleProductForm.consInput),
      placement: articleProductForm.placement,
      display_order: Math.max(
        0,
        Number.parseInt(articleProductForm.displayOrder, 10) || 0,
      ),
    };

    const supabase = createClient();
    const result = editingArticleProductId
      ? await supabase
          .from("article_products")
          .update(payload)
          .eq("id", editingArticleProductId)
      : await supabase.from("article_products").insert(payload);

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setSuccessMessage(
        editingArticleProductId
          ? "Article product updated."
          : "Article product added.",
      );
      resetArticleProductForm(false);
      await refreshAffiliateData();
    }

    setArticleProductSaving(false);
  };

  const handleArticleProductDelete = async (product: ArticleProduct) => {
    if (formData.workflowStatus === "published") {
      setErrorMessage(
        "Unpublish this article to draft before changing its product recommendations.",
      );
      return;
    }

    if (!window.confirm(`Remove ${product.product_name} from this article?`)) {
      return;
    }

    setArticleProductSaving(true);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("article_products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Article product removed.");
      resetArticleProductForm(false);
      await refreshAffiliateData();
    }

    setArticleProductSaving(false);
  };

  const handleAffiliateSuggestionStatus = async (
    suggestion: ArticleAffiliateSuggestion,
    reviewStatus: AffiliateSuggestionReviewStatus,
  ) => {
    setAffiliateSuggestionSavingId(suggestion.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("article_affiliate_suggestions")
      .update({ review_status: reviewStatus })
      .eq("id", suggestion.id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setArticleAffiliateSuggestions((current) =>
        current.map((item) =>
          item.id === suggestion.id
            ? { ...item, review_status: reviewStatus }
            : item,
        ),
      );
      setSuccessMessage(
        reviewStatus === "shortlisted"
          ? "Suggestion shortlisted. This does not approve or activate an affiliate program."
          : `Suggestion marked ${reviewStatus}.`,
      );
    }

    setAffiliateSuggestionSavingId(null);
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
    <div className="admin-shell bg-zinc-50 px-3 pb-20 pt-24 sm:px-6 sm:pt-32">
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

        <div
          role="tablist"
          aria-label="Admin sections"
          className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-8 sm:gap-2 sm:rounded-full"
        >
          {(
            ["articles", "pages", "people", "newsletter", "affiliates"] as const
          ).map((section) => (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={activeSection === section}
              onClick={() => setActiveSection(section)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition sm:px-5 ${
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

        {activeSection === "articles" && editingId && (
          <section
            id="admin-article-preview"
            className="mb-6 scroll-mt-28 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-700 sm:text-sm">
                  Selected article
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  Live preview
                </h2>
              </div>
              <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {formatWorkflowStatus(formData.workflowStatus)}
              </span>
            </div>

            <article className="mt-4 grid overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-zinc-50 sm:grid-cols-[14rem_minmax(0,1fr)] sm:rounded-[1.5rem]">
              {formData.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.coverImageUrl}
                  alt={formData.coverImageAlt}
                  className="h-48 w-full object-cover sm:h-full sm:min-h-52"
                />
              ) : (
                <div className="flex h-48 items-end bg-[radial-gradient(circle_at_20%_20%,rgba(190,242,100,0.7),transparent_32%),linear-gradient(135deg,#18181b,#3f3f46)] p-5 text-white sm:h-full sm:min-h-52">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                    Devicefield
                  </p>
                </div>
              )}
              <div className="min-w-0 p-5 sm:p-6">
                <p className="text-sm font-semibold text-lime-700">
                  {formData.category}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                  {seoTitle || "Article title preview"}
                </h3>
                <p className="mt-3 line-clamp-3 leading-6 text-zinc-600">
                  {metaDescription ||
                    "The article meta description will appear here."}
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
          </section>
        )}

        {activeSection === "articles" && reviewPosts.length > 0 && (
          <section className="mb-6 rounded-[1.5rem] border border-lime-300 bg-zinc-950 p-4 text-white shadow-sm sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300 sm:text-sm">
                  Review queue
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Articles awaiting review
                </h2>
              </div>
              <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lime-200">
                {reviewPosts.length} ready
              </span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {reviewPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleEdit(post)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    editingId === post.id
                      ? "border-lime-300 bg-lime-300 text-zinc-950"
                      : "border-white/15 bg-white/5 text-white hover:border-lime-300"
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                    {post.category}
                  </span>
                  <span className="mt-1 block font-semibold leading-6">
                    {post.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)] xl:gap-8">
          {activeSection === "articles" && (
            <form
              onSubmit={handleSubmit}
              className="min-w-0 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6"
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

              <div className="space-y-6">
                {formData.workflowStatus === "published" && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                    <p className="font-semibold">Published content is locked.</p>
                    <p>
                      Use Unpublish to draft before editing. Unpublishing
                      temporarily removes this article from the public site and
                      requires review and approval before it can be published
                      again.
                    </p>
                  </div>
                )}
                <fieldset
                  disabled={formData.workflowStatus === "published"}
                  className="contents disabled:opacity-60"
                >
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
                    <span
                      className={
                        seoTitle.length > 70 ? "text-red-600" : "text-zinc-400"
                      }
                    >
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
                    <span
                      className={
                        excerptCharacters > 165
                          ? "text-red-600"
                          : "text-zinc-400"
                      }
                    >
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
                    <span
                      className={
                        metaDescription.length > 160
                          ? "text-red-600"
                          : "text-zinc-400"
                      }
                    >
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
                      Article type
                    </span>
                    <select
                      value={formData.articleType}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          articleType: event.target.value as ArticleType,
                        }))
                      }
                      className="form-select w-full rounded-2xl border-zinc-200"
                    >
                      {ARTICLE_TYPES.map((articleType) => (
                        <option key={articleType} value={articleType}>
                          {formatOptionLabel(articleType)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Testing status
                    </span>
                    <select
                      value={formData.testingStatus}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          testingStatus: event.target.value as
                            | TestingStatus
                            | "",
                        }))
                      }
                      className="form-select w-full rounded-2xl border-zinc-200"
                    >
                      <option value="">Select status</option>
                      {TESTING_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatOptionLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Workflow
                    </span>
                    <div className="flex min-h-12 items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-sm font-medium text-zinc-600">
                        {formatWorkflowStatus(formData.workflowStatus)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(["authorId", "reviewerId"] as const).map((field) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        {field === "authorId" ? "Author" : "Reviewed by"}
                      </span>
                      <select
                        value={formData[field]}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        className="form-select w-full rounded-2xl border-zinc-200"
                      >
                        <option value="">Select profile</option>
                        {authors.map((author) => (
                          <option key={author.id} value={author.id}>
                            {author.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Article body
                  </span>
                  <div className="mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Alt text for a new inline image
                        </span>
                        <input
                          type="text"
                          value={bodyImageAlt}
                          onChange={(event) =>
                            setBodyImageAlt(event.target.value)
                          }
                          className="form-input w-full rounded-2xl border-zinc-200"
                          placeholder="Descriptive image alt text"
                        />
                      </label>
                      <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto">
                        {bodyImageUploading
                          ? "Uploading..."
                          : "Upload body image"}
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
                      This field applies only to the next inline upload and
                      resets afterward. Existing inline image alt text is stored
                      inside the Markdown below. The featured image uses the
                      separate Cover image alt text field above.
                    </p>
                    {bodyImages.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3">
                        {bodyImages.map((image, index) => (
                          <p
                            key={`${image.src}-${index}`}
                            className="text-xs leading-5 text-zinc-600"
                          >
                            <span className="font-semibold text-zinc-800">
                              Inline image {index + 1} alt:
                            </span>{" "}
                            {image.alt || "Missing alt text"}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
                        No inline body images are in this article. A featured
                        cover image is tracked separately.
                      </p>
                    )}
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
                </div>

                <details
                  open
                  className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 sm:p-5"
                >
                  <summary className="cursor-pointer font-semibold text-zinc-950">
                    Verdict and trust fields
                  </summary>
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Quick verdict
                      </span>
                      <textarea
                        rows={3}
                        value={formData.quickVerdict}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            quickVerdict: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Best for
                        </span>
                        <textarea
                          rows={3}
                          value={formData.bestFor}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              bestFor: event.target.value,
                            }))
                          }
                          className="form-textarea w-full rounded-2xl border-zinc-200"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          Avoid if
                        </span>
                        <textarea
                          rows={3}
                          value={formData.avoidIf}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              avoidIf: event.target.value,
                            }))
                          }
                          className="form-textarea w-full rounded-2xl border-zinc-200"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Compatibility notes
                      </span>
                      <textarea
                        rows={4}
                        value={formData.compatibilityNotes}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            compatibilityNotes: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Testing methodology / selection criteria
                      </span>
                      <textarea
                        rows={4}
                        value={formData.testingMethod}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            testingMethod: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Known limitations
                      </span>
                      <textarea
                        rows={4}
                        value={formData.limitations}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            limitations: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200"
                      />
                    </label>
                  </div>
                </details>

                <details className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <summary className="cursor-pointer font-semibold text-zinc-950">
                    Sources, claims, and evidence JSON
                  </summary>
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Sources JSON array
                      </span>
                      <textarea
                        rows={6}
                        value={formData.sourcesInput}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            sourcesInput: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200 font-mono text-xs"
                        placeholder={
                          '[{"title":"Vendor documentation","url":"https://...","note":"Compatibility requirements"}]'
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Claims JSON array
                      </span>
                      <textarea
                        rows={6}
                        value={formData.claimsInput}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            claimsInput: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200 font-mono text-xs"
                        placeholder={
                          '[{"claim":"Supports USB connectivity","source_url":"https://...","risk":"medium","resolved":true}]'
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        Original evidence JSON array
                      </span>
                      <textarea
                        rows={6}
                        value={formData.originalEvidenceInput}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            originalEvidenceInput: event.target.value,
                          }))
                        }
                        className="form-textarea w-full rounded-2xl border-zinc-200 font-mono text-xs"
                        placeholder={
                          '[{"label":"Setup screenshot","url":"https://...","note":"Captured during testing"}]'
                        }
                      />
                    </label>
                  </div>
                </details>

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
                    placeholder={
                      "Question one? | Answer one.\nQuestion two? | Answer two."
                    }
                  />
                </label>

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

                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-zinc-950">
                      Cover image
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Keep the public URL and descriptive alt text together.
                    </p>
                  </div>
                  {currentCoverImages.length > 0 && (
                    <div className="mb-5 border-b border-zinc-200 pb-5">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div>
                          <p className="text-sm font-semibold text-zinc-950">
                            Generated cover options
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            Select the strongest image before approving the
                            article. The public article uses only the selected
                            option.
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
                          {currentCoverImages.length} option
                          {currentCoverImages.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {currentCoverImages.map((image) => {
                          const isSelected =
                            image.image_url === formData.coverImageUrl;
                          return (
                            <button
                              key={image.id}
                              type="button"
                              aria-pressed={isSelected}
                              disabled={
                                isSelected ||
                                coverImageSelectingId !== null ||
                                formData.workflowStatus === "published"
                              }
                              onClick={() =>
                                void handleCoverImageSelect(image)
                              }
                              className={`overflow-hidden rounded-2xl border bg-white text-left transition disabled:cursor-not-allowed ${
                                isSelected
                                  ? "border-lime-500 ring-2 ring-lime-300"
                                  : "border-zinc-200 hover:border-zinc-950 disabled:opacity-60"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image.image_url}
                                alt={image.image_alt}
                                className="aspect-[2/1] w-full object-cover"
                              />
                              <span className="block p-3">
                                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-zinc-950">
                                  <span>{image.label}</span>
                                  {isSelected && (
                                    <span className="rounded-full bg-lime-200 px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em]">
                                      Selected
                                    </span>
                                  )}
                                </span>
                                <span className="mt-2 line-clamp-2 block text-xs leading-5 text-zinc-500">
                                  {image.image_alt}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {formData.workflowStatus === "published" && (
                        <p className="mt-3 text-xs font-medium text-amber-800">
                          Published covers are locked. Unpublish to draft before
                          selecting another option.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block min-w-0">
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
                    </label>

                    <label className="block min-w-0">
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
                        placeholder="Describe the featured image"
                      />
                    </label>
                  </div>

                  <label className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950 sm:w-auto">
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Schedule for
                    </span>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          scheduledFor: event.target.value,
                        }))
                      }
                      className="form-input w-full rounded-2xl border-zinc-200"
                    />
                  </label>

                  <div className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Homepage placement
                    </span>
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["reviewedAt", "Reviewed at"],
                      ["lastReviewedAt", "Last reviewed at"],
                      ["lastVerifiedAt", "Commercial details verified"],
                      ["nextReviewAt", "Next review due"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        {label}
                      </span>
                      <input
                        type="datetime-local"
                        value={formData[field]}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        className="form-input w-full rounded-2xl border-zinc-200"
                      />
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-800">
                    Internal notes
                  </span>
                  <textarea
                    rows={4}
                    value={formData.internalNotes}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        internalNotes: event.target.value,
                      }))
                    }
                    className="form-textarea w-full rounded-2xl border-zinc-200"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Never shown publicly.
                  </p>
                </label>

                </fieldset>

                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-950">
                    Editorial workflow
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Actions are enforced by Supabase, not only by these buttons.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <button
                      type="submit"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus !== "draft"
                      }
                      className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 sm:w-auto disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save draft"}
                    </button>
                    {editingId && (
                      <Link
                        href={`/preview/${editingId}`}
                        target="_blank"
                        className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-950 sm:w-auto"
                      >
                        Preview
                      </Link>
                    )}
                    <WorkflowButton
                      label="Mark ready for review"
                      disabled={
                        saving ||
                        workflowSaving ||
                        !editingId ||
                        formData.workflowStatus !== "draft"
                      }
                      onClick={() => void handleWorkflowAction("mark_ready")}
                    />
                    <WorkflowButton
                      label="Return to draft"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus !== "ready_for_review"
                      }
                      onClick={() =>
                        void handleWorkflowAction("return_to_draft")
                      }
                    />
                    <WorkflowButton
                      label="Approve article"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus !== "ready_for_review"
                      }
                      onClick={() => void handleWorkflowAction("approve")}
                    />
                    <WorkflowButton
                      label="Schedule publication"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus !== "approved"
                      }
                      onClick={() => void handleWorkflowAction("schedule")}
                    />
                    <WorkflowButton
                      label="Unschedule"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus !== "scheduled"
                      }
                      onClick={() => void handleWorkflowAction("unschedule")}
                    />
                    <WorkflowButton
                      label="Publish now"
                      disabled={
                        saving ||
                        workflowSaving ||
                        !["approved", "scheduled"].includes(
                          formData.workflowStatus,
                        )
                      }
                      onClick={() => void handleWorkflowAction("publish")}
                    />
                    <WorkflowButton
                      label="Unpublish to draft"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus !== "published"
                      }
                      onClick={() => void handleWorkflowAction("unpublish")}
                      tone="danger"
                    />
                    <WorkflowButton
                      label="Archive article"
                      disabled={
                        saving ||
                        workflowSaving ||
                        formData.workflowStatus === "archived"
                      }
                      onClick={() => void handleWorkflowAction("archive")}
                      tone="danger"
                    />
                  </div>
                </div>
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
                  These CMS records control the shared navigation/footer,
                  homepage, blog and search indexes, and every publication trust
                  page. Keep the JSON keys intact.
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

          {activeSection === "people" && (
            <section className="grid gap-6 lg:col-span-2 lg:grid-cols-[0.9fr_1.1fr]">
              <form
                onSubmit={handleAuthorSubmit}
                className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Author profiles
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  Add an author or reviewer
                </h2>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Name
                    </span>
                    <input
                      required
                      value={authorForm.name}
                      onChange={(event) =>
                        setAuthorForm((current) => ({
                          ...current,
                          name: event.target.value,
                          slug: current.slug || slugify(event.target.value),
                        }))
                      }
                      className="form-input w-full rounded-2xl border-zinc-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Slug
                    </span>
                    <input
                      required
                      value={authorForm.slug}
                      onChange={(event) =>
                        setAuthorForm((current) => ({
                          ...current,
                          slug: slugify(event.target.value),
                        }))
                      }
                      className="form-input w-full rounded-2xl border-zinc-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Job title
                    </span>
                    <input
                      value={authorForm.jobTitle}
                      onChange={(event) =>
                        setAuthorForm((current) => ({
                          ...current,
                          jobTitle: event.target.value,
                        }))
                      }
                      className="form-input w-full rounded-2xl border-zinc-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Bio
                    </span>
                    <textarea
                      required
                      rows={5}
                      value={authorForm.bio}
                      onChange={(event) =>
                        setAuthorForm((current) => ({
                          ...current,
                          bio: event.target.value,
                        }))
                      }
                      className="form-textarea w-full rounded-2xl border-zinc-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Avatar URL
                    </span>
                    <input
                      type="url"
                      value={authorForm.avatarUrl}
                      onChange={(event) =>
                        setAuthorForm((current) => ({
                          ...current,
                          avatarUrl: event.target.value,
                        }))
                      }
                      className="form-input w-full rounded-2xl border-zinc-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-800">
                      Website URL
                    </span>
                    <input
                      type="url"
                      value={authorForm.websiteUrl}
                      onChange={(event) =>
                        setAuthorForm((current) => ({
                          ...current,
                          websiteUrl: event.target.value,
                        }))
                      }
                      className="form-input w-full rounded-2xl border-zinc-200"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={authorSaving}
                    className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {authorSaving ? "Saving..." : "Create profile"}
                  </button>
                </div>
              </form>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  Authors and reviewers
                </h2>
                <div className="mt-5 space-y-3">
                  {authors.map((author) => (
                    <article
                      key={author.id}
                      className="rounded-2xl border border-zinc-200 p-4"
                    >
                      <h3 className="font-semibold text-zinc-950">
                        {author.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {author.job_title ?? "No title set"}
                      </p>
                      {author.bio && (
                        <p className="mt-3 text-sm leading-6 text-zinc-600">
                          {author.bio}
                        </p>
                      )}
                    </article>
                  ))}
                  {authors.length === 0 && (
                    <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                      Create the first real author profile before assigning
                      article bylines.
                    </p>
                  )}
                </div>
              </div>
            </section>
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
                    Subscriptions require email confirmation before they are
                    synchronized to the sending provider.
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

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-zinc-100 p-4">
                  <p className="text-3xl font-semibold tracking-tight text-zinc-950">
                    {
                      subscribers.filter((item) => item.status === "subscribed")
                        .length
                    }
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">Subscribed</p>
                </div>
                <div className="rounded-2xl bg-zinc-100 p-4">
                  <p className="text-3xl font-semibold tracking-tight text-zinc-950">
                    {
                      subscribers.filter((item) => item.status === "pending")
                        .length
                    }
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Pending confirmation
                  </p>
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
                        <p className="mt-1 text-xs text-zinc-400">
                          {subscriber.provider_synced_at
                            ? "Provider synchronized"
                            : subscriber.status === "subscribed"
                              ? "Provider sync pending"
                              : "Not sent to provider"}
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
                    No subscription records yet. New requests appear here as
                    pending until the reader confirms by email.
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

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                      {
                        affiliatePrograms.filter(
                          (program) => program.status === "approved",
                        ).length
                      }
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Approved programs
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {inactiveOrBrokenLinks.length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Inactive or broken
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold tracking-tight">
                      {pendingAffiliateSuggestions.length}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Pending suggestions
                    </p>
                  </div>
                </div>
              </div>

              <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Research queue
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  Article affiliate opportunities
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                  Codex-researched opportunities stay private until you verify
                  the program, apply, receive approval, create an affiliate
                  link, and add a structured article product.
                </p>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {articleAffiliateSuggestions.map((suggestion) => {
                    const post = posts.find(
                      (item) => item.id === suggestion.article_id,
                    );
                    return (
                      <AffiliateSuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        articleTitle={post?.title ?? "Unknown article"}
                        saving={affiliateSuggestionSavingId === suggestion.id}
                        onOpenArticle={
                          post ? () => handleEdit(post) : undefined
                        }
                        onStatusChange={(status) =>
                          void handleAffiliateSuggestionStatus(
                            suggestion,
                            status,
                          )
                        }
                      />
                    );
                  })}
                  {articleAffiliateSuggestions.length === 0 && (
                    <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600 lg:col-span-2">
                      No affiliate suggestions have been submitted with an
                      article yet.
                    </p>
                  )}
                </div>
              </section>

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
                        {editingAffiliateProgramId
                          ? "Edit program"
                          : "Add program"}
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
                        placeholder="Amazon Associates, B&H Photo, Newegg"
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
                              status: event.target
                                .value as AffiliateProgramStatus,
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
                        value={
                          affiliateLinkForm.programId ||
                          affiliatePrograms[0]?.id ||
                          ""
                        }
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

                    {affiliateLinkForm.active &&
                      selectedAffiliateProgram?.status !== "approved" && (
                        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                          This link cannot be activated until the selected
                          program is approved.
                        </p>
                      )}

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
                      disabled={
                        affiliateSaving || affiliatePrograms.length === 0
                      }
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
                  title="Top clicked pages"
                  rows={clicksByArticle}
                  emptyLabel="No page click data yet."
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
                          <span className="block font-semibold">
                            {link.label}
                          </span>
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

          <aside className="min-w-0 space-y-6">
            {activeSection === "articles" && (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Affiliate research
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  Suggested programs and placements
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  These are private research leads, not approved programs or
                  public affiliate links. Verify each opportunity before using
                  it in the article.
                </p>
                {!editingId ? (
                  <p className="mt-4 rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                    Select an article to review its affiliate suggestions.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {currentAffiliateSuggestions.map((suggestion) => (
                      <AffiliateSuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        saving={affiliateSuggestionSavingId === suggestion.id}
                        onStatusChange={(status) =>
                          void handleAffiliateSuggestionStatus(
                            suggestion,
                            status,
                          )
                        }
                      />
                    ))}
                    {currentAffiliateSuggestions.length === 0 && (
                      <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                        No researched affiliate opportunities were submitted for
                        this article.
                      </p>
                    )}
                  </div>
                )}
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
                          getPreviewString(
                            activePageDefaults,
                            "eyebrow",
                            "Page",
                          ),
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
                          {getPreviewCategoryEntries(
                            pagePreviewContent,
                            activePageDefaults.categoryEntries,
                          ).map((entry) => (
                            <span
                              key={entry.title}
                              className="rounded-2xl bg-white px-3 py-4 text-sm font-semibold text-zinc-800"
                            >
                              {entry.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {pageFormData.slug === "global" && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                            Navigation and footer
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(pagePreviewContent?.navItems)
                              ? pagePreviewContent.navItems
                              : Array.isArray(activePageDefaults.navItems)
                                ? activePageDefaults.navItems
                                : []
                            ).map((item, index) => {
                              const label =
                                item &&
                                typeof item === "object" &&
                                "label" in item
                                  ? String(item.label)
                                  : `Link ${index + 1}`;
                              return (
                                <span
                                  key={`${label}-${index}`}
                                  className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(pageFormData.slug === "blog" ||
                        pageFormData.slug === "search") && (
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

                      {pageFormData.slug === "about" && (
                        <div className="space-y-3">
                          {[
                            "missionHeading",
                            "standardsHeading",
                            "independenceHeading",
                          ].map((key) => (
                            <div key={key} className="rounded-2xl bg-white p-4">
                              <p className="font-semibold text-zinc-950">
                                {getPreviewString(
                                  pagePreviewContent,
                                  key,
                                  getPreviewString(
                                    activePageDefaults,
                                    key,
                                    "About section",
                                  ),
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {(
                        [
                          "contact",
                          "review-methodology",
                          "editorial-policy",
                          "affiliate-disclosure",
                          "terms",
                          "privacy",
                        ] as SitePageSlug[]
                      ).includes(pageFormData.slug) && (
                        <div className="space-y-3">
                          {getPreviewSections(pagePreviewContent)
                            .slice(0, 3)
                            .map((section) => (
                              <div
                                key={section.title}
                                className="rounded-2xl bg-white p-4"
                              >
                                <p className="font-semibold text-zinc-950">
                                  {section.title}
                                </p>
                                <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                                  {section.body}
                                </p>
                              </div>
                            ))}
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
                          {page.slug === "global"
                            ? "Shared UI"
                            : `/${page.slug === "home" ? "" : page.slug}`}
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
                  Delivery workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Double opt-in with provider sync
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Resend sends confirmation messages from the configured
                  Devicefield address. Only confirmed contacts are synchronized,
                  and unsubscribe requests update both Supabase and Resend.
                </p>
              </div>
            )}

            {activeSection === "articles" && (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Publish readiness
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  These are editorial warnings, not a ranking score. Resolve
                  required items and use judgment for the rest.
                </p>
                <div className="mt-5 space-y-5">
                  {[
                    {
                      title: "Required before publishing",
                      checks: requiredChecks,
                      missingLabel: "Missing",
                      readyLabel: "Ready",
                    },
                    {
                      title: "Recommended",
                      checks: recommendedChecks,
                      missingLabel: "Consider",
                      readyLabel: "Met",
                    },
                    {
                      title: "Needs human judgment",
                      checks: humanJudgmentChecks,
                      missingLabel: "Review",
                      readyLabel: "Signal found",
                    },
                  ].map((group) => (
                    <section key={group.title}>
                      <h3 className="text-sm font-semibold text-zinc-950">
                        {group.title}
                      </h3>
                      <ul className="mt-3 space-y-3">
                        {group.checks.map((check) => (
                          <li
                            key={check.label}
                            className={`rounded-2xl border p-3 text-sm ${
                              check.passed
                                ? "border-zinc-200 bg-zinc-50 text-zinc-700"
                                : "border-amber-200 bg-amber-50 text-amber-900"
                            }`}
                          >
                            <p className="font-semibold">
                              {check.passed
                                ? group.readyLabel
                                : group.missingLabel}
                              : {check.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 opacity-75">
                              {check.detail}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
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
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
                  Structured recommendations
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  Article products
                </h2>

                {!editingId ? (
                  <p className="mt-4 rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">
                    Create or edit an article first, then connect products to
                    real affiliate links here.
                  </p>
                ) : (
                  <div className="mt-5 space-y-5">
                    {formData.workflowStatus === "published" && (
                      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                        Product recommendations are locked while this article is
                        published. Unpublish it to draft before making changes.
                      </p>
                    )}
                    <div className="space-y-3">
                      {currentArticleProducts.map((product) => {
                        const affiliateLink = affiliateLinks.find(
                          (link) => link.id === product.affiliate_link_id,
                        );
                        return (
                          <article
                            key={product.id}
                            className="rounded-2xl border border-zinc-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                  {product.placement} / {product.display_order}
                                </p>
                                <h3 className="mt-1 font-semibold text-zinc-950">
                                  {product.product_name}
                                </h3>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {affiliateLink?.label ??
                                    "Missing affiliate link"}
                                </p>
                              </div>
                              {product.award && (
                                <span className="rounded-full bg-lime-200 px-2 py-1 text-xs font-semibold text-zinc-950">
                                  {product.award}
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleArticleProductEdit(product)
                                }
                                disabled={
                                  formData.workflowStatus === "published"
                                }
                                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleArticleProductDelete(product)
                                }
                                disabled={articleProductSaving}
                                className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </article>
                        );
                      })}
                      {currentArticleProducts.length === 0 && (
                        <p className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600">
                          No structured products are connected to this article.
                        </p>
                      )}
                    </div>

                    <fieldset
                      disabled={formData.workflowStatus === "published"}
                      className="space-y-3 border-t border-zinc-200 pt-5 disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-zinc-950">
                          {editingArticleProductId
                            ? "Edit product"
                            : "Add product"}
                        </h3>
                        {editingArticleProductId && (
                          <button
                            type="button"
                            onClick={() => resetArticleProductForm()}
                            className="text-xs font-semibold text-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-zinc-700">
                          Affiliate link (optional until approved)
                        </span>
                        <select
                          value={articleProductForm.affiliateLinkId}
                          onChange={(event) =>
                            setArticleProductForm((current) => ({
                              ...current,
                              affiliateLinkId: event.target.value,
                            }))
                          }
                          className="form-select w-full rounded-2xl border-zinc-200 text-sm"
                        >
                          <option value="">No approved link yet</option>
                          {affiliateLinks
                            .filter(
                              (link) =>
                                link.active ||
                                link.id === articleProductForm.affiliateLinkId,
                            )
                            .map((link) => {
                              const program = affiliatePrograms.find(
                                (item) => item.id === link.program_id,
                              );
                              return (
                                <option key={link.id} value={link.id}>
                                  {link.label} / {program?.name ?? link.slug}
                                </option>
                              );
                            })}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-zinc-700">
                          Product name
                        </span>
                        <input
                          type="text"
                          value={articleProductForm.productName}
                          onChange={(event) =>
                            setArticleProductForm((current) => ({
                              ...current,
                              productName: event.target.value,
                            }))
                          }
                          className="form-input w-full rounded-2xl border-zinc-200 text-sm"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-zinc-700">
                            Placement
                          </span>
                          <select
                            value={articleProductForm.placement}
                            onChange={(event) =>
                              setArticleProductForm((current) => ({
                                ...current,
                                placement: event.target
                                  .value as ArticleProductPlacement,
                              }))
                            }
                            className="form-select w-full rounded-2xl border-zinc-200 text-sm"
                          >
                            {ARTICLE_PRODUCT_PLACEMENTS.map((placement) => (
                              <option key={placement} value={placement}>
                                {placement}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-zinc-700">
                            Display order
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={articleProductForm.displayOrder}
                            onChange={(event) =>
                              setArticleProductForm((current) => ({
                                ...current,
                                displayOrder: event.target.value,
                              }))
                            }
                            className="form-input w-full rounded-2xl border-zinc-200 text-sm"
                          />
                        </label>
                      </div>

                      {(
                        [
                          ["award", "Award", "Best overall"],
                          [
                            "bestFor",
                            "Best for",
                            "Teams needing offline reliability",
                          ],
                          [
                            "avoidIf",
                            "Avoid if",
                            "You need native iPad support",
                          ],
                        ] as const
                      ).map(([field, label, placeholder]) => (
                        <label key={field} className="block">
                          <span className="mb-1 block text-xs font-semibold text-zinc-700">
                            {label}
                          </span>
                          <input
                            type="text"
                            value={articleProductForm[field]}
                            onChange={(event) =>
                              setArticleProductForm((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            placeholder={placeholder}
                            className="form-input w-full rounded-2xl border-zinc-200 text-sm"
                          />
                        </label>
                      ))}

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-zinc-700">
                          Verdict
                        </span>
                        <textarea
                          rows={3}
                          value={articleProductForm.verdict}
                          onChange={(event) =>
                            setArticleProductForm((current) => ({
                              ...current,
                              verdict: event.target.value,
                            }))
                          }
                          className="form-textarea w-full rounded-2xl border-zinc-200 text-sm"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-zinc-700">
                            Pros, comma-separated
                          </span>
                          <textarea
                            rows={3}
                            value={articleProductForm.prosInput}
                            onChange={(event) =>
                              setArticleProductForm((current) => ({
                                ...current,
                                prosInput: event.target.value,
                              }))
                            }
                            className="form-textarea w-full rounded-2xl border-zinc-200 text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-zinc-700">
                            Cons, comma-separated
                          </span>
                          <textarea
                            rows={3}
                            value={articleProductForm.consInput}
                            onChange={(event) =>
                              setArticleProductForm((current) => ({
                                ...current,
                                consInput: event.target.value,
                              }))
                            }
                            className="form-textarea w-full rounded-2xl border-zinc-200 text-sm"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleArticleProductSave()}
                        disabled={articleProductSaving}
                        className="w-full rounded-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {articleProductSaving
                          ? "Saving..."
                          : editingArticleProductId
                            ? "Update product"
                            : "Add product"}
                      </button>
                    </fieldset>
                  </div>
                )}
              </div>
            )}

            {activeSection === "articles" && (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  Articles
                </h2>
                <div className="mt-5 space-y-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-zinc-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {formatWorkflowStatus(post.workflow_status)}
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
                        {post.workflow_status === "published" && (
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
