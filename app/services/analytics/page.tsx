import ServiceLayout from "@/components/service-layout";

export const metadata = {
  title: "Instant Analytics - DeviceField",
  description:
    "Real-time analytics and insights for your digital platforms",
};

export default function AnalyticsPage() {
  return (
    <ServiceLayout
      title="Instant Analytics"
      description="Collect essential insights about how visitors are using your site with in-depth page view metrics like pages, referring sites, and more."
      icon={
        <svg
          className="fill-yellow-primary"
          xmlns="http://www.w3.org/2000/svg"
          width={48}
          height={48}
        >
          <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2-4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4Zm1 10a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H5Z" />
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
        "Website performance monitoring",
        "Marketing campaign tracking",
        "User experience optimization",
        "Content strategy planning",
        "Conversion funnel analysis",
      ]}
    />
  );
}
