import ServiceLayout from "@/components/service-layout";

export const metadata = {
  title: "SEO & Performance - DeviceField",
  description:
    "Optimize your website's search rankings and performance",
};

export default function SEOPerformancePage() {
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
      features={[
        "Keyword Research",
        "On-Page Optimization",
        "Technical SEO",
        "Page Speed Optimization",
        "Link Building",
        "Performance Monitoring",
      ]}
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
