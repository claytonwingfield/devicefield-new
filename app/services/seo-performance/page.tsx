import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { SearchIcon } from "@/components/ui/search";
import { FolderCogIcon } from "@/components/ui/folder-cog";
import { FlaskIcon } from "@/components/ui/flask";
import { AtomIcon } from "@/components/ui/atom";
import { LinkIcon } from "@/components/ui/link";
import { CpuIcon } from "@/components/ui/cpu";

export const metadata = {
  title: "SEO & Performance - DeviceField",
  description: "Optimize your website's search rankings and performance",
};

export default function SEOPerformancePage() {
  const features: FeatureItem[] = [
    {
      title: "Keyword Research",
      description:
        "Identify high-value search terms and phrases that your target audience uses, ensuring your content aligns with intent.",
      icon: <SearchIcon size={24} />,
    },
    {
      title: "On-Page Optimization",
      description:
        "Refine headers, content structure, and internal linking to make your pages more relevant and authoritative to search algorithms.",
      icon: <FolderCogIcon size={24} />,
    },
    {
      title: "Technical SEO",
      description:
        "Fix crawl errors, broken links, and sitemap issues. We ensure the backend architecture is healthy and indexable.",
      icon: <FlaskIcon size={24} />,
    },
    {
      title: "Page Speed Optimization",
      description:
        "Minimize load times by compressing assets, optimizing code, and leveraging caching to improve Core Web Vitals scores.",
      icon: <AtomIcon size={24} />,
    },
    {
      title: "Link Building",
      description:
        "Develop a strategy to acquire high-quality backlinks from reputable sources, boosting your domain authority and trust.",
      icon: <LinkIcon size={24} />,
    },
    {
      title: "Performance Monitoring",
      description:
        "Continuous tracking of rankings and speed metrics to identify issues before they impact your traffic or conversion rates.",
      icon: <CpuIcon size={24} />,
    },
  ];

  return (
    <ServiceLayout
      title="SEO & Performance"
      description="Collect essential insights about how visitors are using your site with in-depth page view metrics like pages, referring sites, and more."
      icon={
        <svg
          className="fill-yellow-primary"
          xmlns="http://www.w3.org/2000/svg"
          width={48}
          height={48}
        >
          <path
            d="M2.248 6.285a1 1 0 0 1-1.916-.57A8.014 8.014 0 0 1 5.715.332a1 1 0 0 1 .57 1.916 6.014 6.014 0 0 0-4.037 4.037Z"
            opacity=".3"
          />
          <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm1.715-6.752a1 1 0 0 1 .57-1.916 8.014 8.014 0 0 1 5.383 5.383 1 1 0 1 1-1.916.57 6.014 6.014 0 0 0-4.037-4.037Zm4.037 7.467a1 1 0 1 1 1.916.57 8.014 8.014 0 0 1-5.383 5.383 1 1 0 1 1-.57-1.916 6.014 6.014 0 0 0 4.037-4.037Zm-7.467 4.037a1 1 0 1 1-.57 1.916 8.014 8.014 0 0 1-5.383-5.383 1 1 0 1 1 1.916-.57 6.014 6.014 0 0 0 4.037 4.037Z" />
        </svg>
      }
      features={features}
      benefits={[
        "Higher search engine rankings for target keywords",
        "Optimized content that search engines love",
        "Technical improvements for better crawling",
        "Faster load times improving user experience",
        "Quality backlinks boosting domain authority",
        "Continuous monitoring and optimization",
      ]}
      useCases={[
        "Improving organic search visibility",
        "Faster website loading times",
        "Better mobile performance",
        "Competitive SEO analysis",
        "Content optimization strategies",
      ]}
    />
  );
}
