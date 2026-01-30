import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { MetadataVisual } from "@/components/service-visuals";
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
    {
      title: "SEO Metadata",
      description:
        "Optimize title tags, keywords, and robots directives to ensure search engines correctly index and rank your pages.",
      icon: <BoxesIcon size={24} />,
    },
    {
      title: "Open Graph Tags",
      description:
        "Control how your content appears on platforms like Facebook and LinkedIn with precise image, title, and description tags.",
      icon: <BookmarkCheckIcon size={24} />,
    },
    {
      title: "Schema Markup",
      description:
        "Implement JSON-LD structured data to help search engines understand content context, leading to rich results and snippets.",
      icon: <ChevronsLeftRightIcon size={24} />,
    },
    {
      title: "Meta Descriptions",
      description:
        "Craft compelling, click-worthy summaries for search results that improve Click-Through Rates (CTR) without keyword stuffing.",
      icon: <FileTextIcon size={24} />,
    },
    {
      title: "Social Media Tags",
      description:
        "Configure Twitter Cards and other platform-specific meta tags to ensure your links look professional and engaging everywhere.",
      icon: <AtSignIcon size={24} />,
    },
    {
      title: "Structured Data",
      description:
        "Organize complex data hierarchies for products, events, and organizations to maximize visibility in voice search and AI results.",
      icon: <FolderKanbanIcon size={24} />,
    },
  ];

  return (
    <ServiceLayout
      title="Metadata"
      description="Maximize your digital footprint with precise metadata management. We optimize the hidden code that powers your search rankings, social shares, and how AI understands your content."
      visual={<MetadataVisual />}
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
