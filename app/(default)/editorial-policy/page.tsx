import PolicyPage from "@/components/site/policy-page";
import { getSitePage } from "@/lib/site/pages";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("editorial-policy");
  return {
    title: page.title,
    description: page.meta_description,
    alternates: { canonical: "https://devicefield.com/editorial-policy" },
  };
}

export default function EditorialPolicyPage() {
  return <PolicyPage slug="editorial-policy" />;
}
