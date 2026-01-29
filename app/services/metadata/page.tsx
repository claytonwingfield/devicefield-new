import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { BoxesIcon } from "@/components/ui/boxes";
import { BookmarkCheckIcon } from "@/components/ui/bookmark-check";
import { ChevronsLeftRightIcon } from "@/components/ui/chevrons-left-right";
import { FileTextIcon } from "@/components/ui/file-text";
import { AtSignIcon } from "@/components/ui/at-sign";
import { FolderKanbanIcon } from "@/components/ui/folder-kanban";

export const metadata = {
  title: "Metadata Services - DeviceField",
  description: "Comprehensive metadata management and optimization services",
};

export default function MetadataPage() {
  const features: FeatureItem[] = [
    { title: "SEO Metadata", icon: <BoxesIcon size={24} /> },
    { title: "Open Graph Tags", icon: <BookmarkCheckIcon size={24} /> },
    { title: "Schema Markup", icon: <ChevronsLeftRightIcon size={24} /> },
    { title: "Meta Descriptions", icon: <FileTextIcon size={24} /> },
    { title: "Social Media Tags", icon: <AtSignIcon size={24} /> },
    { title: "Structured Data", icon: <FolderKanbanIcon size={24} /> },
  ];

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
      features={features}
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
