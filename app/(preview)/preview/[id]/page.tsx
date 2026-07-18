import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarkdownContent from "@/components/blog/markdown-content";
import AffiliateDisclosure from "@/components/affiliate/AffiliateDisclosure";
import ProductCard from "@/components/affiliate/ProductCard";
import { getAffiliateHref } from "@/lib/affiliate/server";
import type {
  AffiliateLinkWithProgram,
  ArticleProduct,
} from "@/lib/affiliate/types";
import {
  formatPostDate,
  formatWorkflowStatus,
  type Author,
  type BlogPost,
} from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Article preview - Devicefield",
  robots: { index: false, follow: false, noarchive: true },
};

export const dynamic = "force-dynamic";

type PreviewArticleProduct = ArticleProduct & {
  affiliate_links?:
    | AffiliateLinkWithProgram
    | AffiliateLinkWithProgram[]
    | null;
};

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/devicefield-editor-login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") notFound();

  const { data: postData } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!postData) notFound();
  const post = postData as BlogPost;

  const [{ data: productsData }, { data: peopleData }] = await Promise.all([
    supabase
      .from("article_products")
      .select("*, affiliate_links(*, affiliate_programs(*))")
      .eq("article_id", post.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("authors")
      .select("*")
      .in("id", [post.author_id, post.reviewer_id].filter(Boolean) as string[]),
  ]);
  const products = (productsData ?? []) as unknown as PreviewArticleProduct[];
  const people = (peopleData ?? []) as Author[];
  const author = people.find((person) => person.id === post.author_id);
  const reviewer = people.find((person) => person.id === post.reviewer_id);
  const hasAffiliateLinks =
    products.length > 0 || /\{sponsored\}/i.test(post.content);

  return (
    <main className="min-h-screen bg-zinc-50 pb-20 pt-20">
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-lg sm:px-6">
        <span>Preview mode: {formatWorkflowStatus(post.workflow_status)}</span>
        <Link
          href="/admin"
          className="rounded-full bg-zinc-950 px-4 py-2 text-white"
        >
          Exit preview
        </Link>
      </div>
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <header className="border-b border-zinc-200 pb-10">
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-zinc-500">
            <span className="rounded-full bg-lime-300 px-3 py-1 text-zinc-950">
              {post.category}
            </span>
            {post.testing_status && (
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 capitalize">
                {post.testing_status}
              </span>
            )}
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl">
            {post.title}
          </h1>
          <p className="mt-6 text-xl leading-8 text-zinc-600">{post.excerpt}</p>
          <p className="mt-5 text-sm text-zinc-500">
            {author ? `Written by ${author.name}` : "Author not assigned"}
            {reviewer
              ? ` / Reviewed by ${reviewer.name}`
              : " / Reviewer not assigned"}
            {post.last_reviewed_at
              ? ` / Last reviewed ${formatPostDate(post.last_reviewed_at)}`
              : ""}
          </p>
          {hasAffiliateLinks && <AffiliateDisclosure className="mt-5" />}
        </header>

        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            className="my-10 block aspect-video w-full max-w-full rounded-[1.75rem] bg-zinc-950 object-cover"
          />
        )}

        {post.quick_verdict?.verdict && (
          <section className="my-10 rounded-[1.5rem] bg-zinc-950 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">
              Quick verdict
            </p>
            <p className="mt-3 text-xl leading-8">
              {post.quick_verdict.verdict}
            </p>
          </section>
        )}

        <MarkdownContent content={post.content} />

        {(post.compatibility_notes ||
          post.testing_method ||
          post.limitations) && (
          <div className="mt-12 grid gap-4">
            {post.compatibility_notes && (
              <PreviewSection
                title="Compatibility notes"
                body={post.compatibility_notes}
              />
            )}
            {post.testing_method && (
              <PreviewSection
                title="Testing methodology"
                body={post.testing_method}
              />
            )}
            {post.limitations && (
              <PreviewSection
                title="Known limitations"
                body={post.limitations}
              />
            )}
          </div>
        )}

        {products.length > 0 && (
          <section className="mt-12">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Structured recommendations
            </h2>
            <div className="mt-5 grid gap-5">
              {products.map((product) => {
                const affiliateLink = Array.isArray(product.affiliate_links)
                  ? (product.affiliate_links[0] ?? null)
                  : (product.affiliate_links ?? null);
                const approvedAffiliateLink =
                  affiliateLink?.active &&
                  affiliateLink.affiliate_programs?.status === "approved"
                    ? affiliateLink
                    : null;

                return (
                  <ProductCard
                    key={product.id}
                    name={product.product_name}
                    description={
                      product.verdict ?? "Recommendation details pending."
                    }
                    href={
                      approvedAffiliateLink
                        ? getAffiliateHref(approvedAffiliateLink)
                        : null
                    }
                    ctaLabel={
                      approvedAffiliateLink?.label ?? "View current pricing"
                    }
                    meta={
                      product.award ??
                      (approvedAffiliateLink ? null : "Affiliate link pending")
                    }
                    bestFor={product.best_for}
                    avoidIf={product.avoid_if}
                    pros={product.pros}
                    cons={product.cons}
                    articleId={post.id}
                    placement={`preview-${product.placement}`}
                  />
                );
              })}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}

function PreviewSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
      <p className="mt-3 whitespace-pre-line leading-7 text-zinc-600">{body}</p>
    </section>
  );
}
