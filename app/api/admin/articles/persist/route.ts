import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getBlogCategoryByName } from "@/lib/blog/types";
import { getArticleUrl } from "@/lib/site/identity";
import { hasAllowedRequestOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

const WORKFLOW_ACTIONS = [
  "save_draft",
  "mark_ready",
  "return_to_draft",
  "approve",
  "schedule",
  "unschedule",
  "publish",
  "unpublish",
  "archive",
] as const;

type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

type PersistArticleBody = {
  articleId?: unknown;
  article?: unknown;
  action?: unknown;
  scheduledFor?: unknown;
  previousSlug?: unknown;
  previousCategory?: unknown;
};

function isWorkflowAction(value: unknown): value is WorkflowAction {
  return (
    typeof value === "string" &&
    WORKFLOW_ACTIONS.includes(value as WorkflowAction)
  );
}

function isArticlePayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeSlug(value: unknown) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ? value
    : null;
}

function revalidateArticleRoutes(
  article: Record<string, unknown>,
  previousSlug: unknown,
  previousCategory: unknown,
) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");

  const slugs = [safeSlug(article.slug), safeSlug(previousSlug)].filter(
    (slug): slug is string => Boolean(slug),
  );
  for (const slug of Array.from(new Set(slugs))) {
    revalidatePath(`/blog/${slug}`);
  }

  const categories = [article.category, previousCategory]
    .filter((value): value is string => typeof value === "string")
    .map(getBlogCategoryByName)
    .filter((category) => category !== null);
  for (const category of categories) {
    revalidatePath(`/category/${category.slug}`);
  }
}

export async function POST(request: NextRequest) {
  if (!hasAllowedRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Article request rejected." },
      { status: 403 },
    );
  }

  if (Number(request.headers.get("content-length") ?? 0) > 250_000) {
    return NextResponse.json(
      { error: "Article request is too large." },
      { status: 413 },
    );
  }

  let body: PersistArticleBody;
  try {
    body = (await request.json()) as PersistArticleBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid article request." },
      { status: 400 },
    );
  }

  if (!isWorkflowAction(body.action) || !isArticlePayload(body.article)) {
    return NextResponse.json(
      { error: "Invalid article request." },
      { status: 400 },
    );
  }

  const articleSlug = safeSlug(body.article.slug);
  if (!articleSlug) {
    return NextResponse.json(
      { error: "Article slug is invalid." },
      { status: 400 },
    );
  }
  const article = {
    ...body.article,
    slug: articleSlug,
    canonical_url: getArticleUrl(articleSlug),
  };

  const articleId =
    typeof body.articleId === "string" && body.articleId.length > 0
      ? body.articleId
      : null;
  const scheduledFor =
    typeof body.scheduledFor === "string" && body.scheduledFor.length > 0
      ? body.scheduledFor
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.rpc("persist_article_workflow", {
    p_article_id: articleId,
    p_article: article,
    p_action: body.action,
    p_scheduled_for: scheduledFor,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (!isArticlePayload(data)) {
    return NextResponse.json(
      { error: "The article was saved but no article record was returned." },
      { status: 500 },
    );
  }

  revalidateArticleRoutes(data, body.previousSlug, body.previousCategory);

  return NextResponse.json(
    { article: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
