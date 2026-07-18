import PolicyPage from "@/components/site/policy-page";
import { getSitePage } from "@/lib/site/pages";

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage("review-methodology");
  return {
    title: page.title,
    description: page.meta_description,
    alternates: { canonical: "https://devicefield.com/review-methodology" },
  };
}

export default function ReviewMethodologyPage() {
  return <PolicyPage slug="review-methodology" />;
}
