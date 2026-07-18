import type {
  ArticleType,
  BlogPost,
  TestingStatus,
} from "./types";
import { getBlogCategoryBySlug } from "./types";

export const BLOG_SEARCH_SORTS = [
  "relevance",
  "newest",
  "updated",
  "title",
] as const;

export type BlogSearchSort = (typeof BLOG_SEARCH_SORTS)[number];

export type BlogSearchFilters = {
  query: string;
  categorySlug?: string;
  articleType?: ArticleType;
  testingStatus?: TestingStatus;
  sort: BlogSearchSort;
};

export type BlogSearchSuggestion = Pick<
  BlogPost,
  "slug" | "title" | "excerpt" | "category" | "tags" | "article_type"
>;

type SearchDocument = Pick<
  BlogPost,
  "title" | "excerpt" | "category" | "tags" | "article_type"
> & {
  content?: string;
};

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getSearchTerms(query: string) {
  return normalizeSearchValue(query).split(/\s+/).filter(Boolean);
}

export function getSearchRelevance(document: SearchDocument, query: string) {
  const terms = getSearchTerms(query);
  if (terms.length === 0) return 0;

  const title = normalizeSearchValue(document.title);
  const excerpt = normalizeSearchValue(document.excerpt);
  const category = normalizeSearchValue(document.category);
  const articleType = normalizeSearchValue(document.article_type);
  const tags = document.tags.map(normalizeSearchValue);
  const content = normalizeSearchValue(document.content ?? "");
  const searchable = [
    title,
    excerpt,
    category,
    articleType,
    tags.join(" "),
    content,
  ].join(" ");

  if (!terms.every((term) => searchable.includes(term))) return -1;

  const normalizedQuery = terms.join(" ");
  let score = 0;
  if (title === normalizedQuery) score += 100;
  if (title.startsWith(normalizedQuery)) score += 50;
  if (title.includes(normalizedQuery)) score += 30;

  for (const term of terms) {
    if (title.startsWith(term)) score += 18;
    else if (title.includes(term)) score += 12;
    if (tags.some((tag) => tag === term)) score += 10;
    else if (tags.some((tag) => tag.includes(term))) score += 6;
    if (category.includes(term)) score += 5;
    if (articleType.includes(term)) score += 4;
    if (excerpt.includes(term)) score += 3;
    if (content.includes(term)) score += 1;
  }

  return score;
}

function getPostTimestamp(post: BlogPost, field: "published_at" | "updated_at") {
  const value = post[field] ?? post.created_at;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function searchPublishedPosts(
  posts: BlogPost[],
  filters: BlogSearchFilters,
) {
  const category = filters.categorySlug
    ? getBlogCategoryBySlug(filters.categorySlug)
    : null;

  const matches = posts.flatMap((post) => {
    if (category && post.category !== category.name) return [];
    if (filters.articleType && post.article_type !== filters.articleType) {
      return [];
    }
    if (
      filters.testingStatus &&
      post.testing_status !== filters.testingStatus
    ) {
      return [];
    }

    const relevance = getSearchRelevance(post, filters.query);
    return relevance >= 0 ? [{ post, relevance }] : [];
  });

  matches.sort((left, right) => {
    if (filters.sort === "title") {
      return left.post.title.localeCompare(right.post.title);
    }
    if (filters.sort === "updated") {
      return (
        getPostTimestamp(right.post, "updated_at") -
        getPostTimestamp(left.post, "updated_at")
      );
    }
    if (filters.sort === "newest" || !filters.query.trim()) {
      return (
        getPostTimestamp(right.post, "published_at") -
        getPostTimestamp(left.post, "published_at")
      );
    }

    return (
      right.relevance - left.relevance ||
      getPostTimestamp(right.post, "published_at") -
        getPostTimestamp(left.post, "published_at")
    );
  });

  return matches.map(({ post }) => post);
}

export function findSearchSuggestions(
  documents: BlogSearchSuggestion[],
  query: string,
  limit = 5,
) {
  if (!query.trim()) return [];

  return documents
    .flatMap((document) => {
      const relevance = getSearchRelevance(document, query);
      return relevance >= 0 ? [{ document, relevance }] : [];
    })
    .sort(
      (left, right) =>
        right.relevance - left.relevance ||
        left.document.title.localeCompare(right.document.title),
    )
    .slice(0, limit)
    .map(({ document }) => document);
}
