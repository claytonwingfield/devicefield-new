import ServiceLayout from "@/components/service-layout";

export const metadata = {
  title: "Metadata Services - DeviceField",
  description:
    "Comprehensive metadata management and optimization services",
};

export default function MetadataPage() {
  return (
    <ServiceLayout
      title="Metadata"
      description="Collect essential insights about how visitors are using your site with in-depth page view metrics like pages, referring sites, and more."
      icon={
        <svg
          className="fill-yellow-primary"
          xmlns="http://www.w3.org/2000/svg"
          width={48}
          height={48}
        >
          <path d="M14.29 2.614a1 1 0 0 0-1.58-1.228L6.407 9.492l-3.199-3.2a1 1 0 1 0-1.414 1.415l4 4a1 1 0 0 0 1.496-.093l7-9ZM1 14a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H1Z" />
        </svg>
      }
      features={[
        "SEO Metadata",
        "Open Graph Tags",
        "Schema Markup",
        "Meta Descriptions",
        "Social Media Tags",
        "Structured Data",
      ]}
      benefits={[
        "Improved search engine visibility and rankings",
        "Better social media sharing with rich previews",
        "Enhanced search result appearance with rich snippets",
        "Compelling descriptions that increase click-through rates",
        "Optimized sharing across all social platforms",
        "Better understanding by search engines and AI",
      ]}
      useCases={[
        "SEO optimization for better rankings",
        "Social media marketing campaigns",
        "E-commerce product listings",
        "Content marketing and blogging",
        "Local business listings",
      ]}
    />
  );
}
