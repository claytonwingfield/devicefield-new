import ServiceLayout from "@/components/service-layout";
import { AnalyticsVisual } from "@/components/service-visuals";

export const metadata = {
  title: "Instant Analytics - DeviceField",
  description: "Real-time analytics and insights for your digital platforms",
};

export default function AnalyticsPage() {
  return (
    <ServiceLayout
      title="Instant Analytics"
      description="Collect essential insights about how visitors are using your site with in-depth page view metrics like pages, referring sites, and more."
      visual={<AnalyticsVisual />}
      icon={
        <svg
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-yellow-primary"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
      features={[
        "Real-Time Tracking",
        "Page View Analytics",
        "User Behavior Insights",
        "Traffic Sources",
        "Custom Dashboards",
        "Export & Reporting",
      ]}
      benefits={[
        "See visitor activity as it happens in real-time",
        "Track which pages are most popular and engaging",
        "Understand how users navigate your site",
        "Identify where your traffic is coming from",
        "Create custom views tailored to your needs",
        "Export data for deeper analysis and reporting",
      ]}
      useCases={[
        "Performance monitoring",
        "Campaign tracking",
        "UX optimization",
        "Content strategy",
        "Conversion analysis",
      ]}
    />
  );
}
