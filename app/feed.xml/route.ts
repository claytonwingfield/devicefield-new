import { getPublishedPosts } from "@/lib/blog/server";

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await getPublishedPosts();
  const items = posts
    .map((post) => {
      const url = `https://devicefield.com/blog/${post.slug}`;
      return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${escapeXml(post.excerpt)}</description><pubDate>${new Date(post.published_at ?? post.created_at).toUTCString()}</pubDate><category>${escapeXml(post.category)}</category></item>`;
    })
    .join("");
  const lastBuildDate = posts[0]?.updated_at
    ? new Date(posts[0].updated_at).toUTCString()
    : new Date(0).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Devicefield</title><link>https://devicefield.com</link><description>Tested devices and systems for modern businesses.</description><language>en-us</language><lastBuildDate>${lastBuildDate}</lastBuildDate>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
