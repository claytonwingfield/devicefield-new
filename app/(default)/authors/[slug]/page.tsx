import { permanentRedirect } from "next/navigation";

type AuthorPageProps = { params: Promise<{ slug: string }> };

export const metadata = {
  title: "Author profile moved - Devicefield",
  robots: { index: false, follow: true },
};

export default async function LegacyAuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  permanentRedirect(`/author/${encodeURIComponent(slug)}`);
}
