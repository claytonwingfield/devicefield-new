import PolicyPage from "@/components/site/policy-page";
import { createPublicPageMetadata } from "@/lib/site/metadata";
import { getSitePage } from "@/lib/site/pages";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("contact");
  return createPublicPageMetadata({
    title: page.title,
    description: page.meta_description,
    canonicalUrl: "https://devicefield.com/contact",
  });
}

export default function ContactPage() {
  return <PolicyPage slug="contact" />;
}
