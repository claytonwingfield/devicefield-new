import PolicyPage from "@/components/site/policy-page";
import { getSitePage } from "@/lib/site/pages";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("contact");
  return {
    title: page.title,
    description: page.meta_description,
    alternates: { canonical: "https://devicefield.com/contact" },
  };
}

export default function ContactPage() {
  return <PolicyPage slug="contact" />;
}
