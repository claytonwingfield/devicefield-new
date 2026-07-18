import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import {
  estimateReadTime,
  formatPostDate,
  getPostCoverImageAlt,
} from "@/lib/blog/types";

export default function BlogCard({
  post,
  priority = false,
}: {
  post: BlogPost;
  priority?: boolean;
}) {
  return (
    <article className="group grid gap-5 rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-[0_20px_70px_rgba(24,24,27,0.06)] transition duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_28px_90px_rgba(24,24,27,0.1)]">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-zinc-950">
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt={getPostCoverImageAlt(post)}
              className="block h-full w-full max-w-full object-cover transition duration-500 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(190,242,100,0.9),transparent_32%),radial-gradient(circle_at_78%_35%,rgba(250,204,21,0.65),transparent_28%),linear-gradient(135deg,#18181b,#3f3f46)]" />
          )}
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-800 backdrop-blur">
            {post.category}
          </div>
        </div>
      </Link>

      <div className="space-y-4 px-1 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <time dateTime={post.published_at ?? post.created_at}>
            {formatPostDate(post.published_at ?? post.created_at)}
          </time>
          <span aria-hidden="true">/</span>
          <span>{estimateReadTime(post.content)} min read</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            <Link href={`/blog/${post.slug}`} className="transition hover:text-lime-700">
              {post.title}
            </Link>
          </h2>
          <p className="line-clamp-3 text-base leading-7 text-zinc-600">{post.excerpt}</p>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex text-sm font-semibold text-zinc-950 underline decoration-lime-400 decoration-2 underline-offset-4 transition hover:text-lime-700"
        >
          Read guide
        </Link>
      </div>
    </article>
  );
}
