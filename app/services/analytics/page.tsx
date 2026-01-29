import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { AnalyticsVisual } from "@/components/service-visuals";
import { ClockIcon } from "@/components/ui/clock";
import { ChartColumnIncreasingIcon } from "@/components/ui/chart-column-increasing";
import { CursorClickIcon } from "@/components/ui/cursor-click";
import { EarthIcon } from "@/components/ui/earth";
import { GalleryThumbnailsIcon } from "@/components/ui/gallery-thumbnails";
import { HardDriveDownloadIcon } from "@/components/ui/hard-drive-download";

export const metadata = {
  title: "Instant Analytics - DeviceField",
  description: "Real-time analytics and insights for your digital platforms",
};

export default function AnalyticsPage() {
  const features: FeatureItem[] = [
    { title: "Real-Time Tracking", icon: <ClockIcon size={24} /> },
    {
      title: "Page View Analytics",
      icon: <ChartColumnIncreasingIcon size={24} />,
    },
    { title: "User Behavior Insights", icon: <CursorClickIcon size={24} /> },
    { title: "Traffic Sources", icon: <EarthIcon size={24} /> },
    { title: "Custom Dashboards", icon: <GalleryThumbnailsIcon size={24} /> },
    { title: "Export & Reporting", icon: <HardDriveDownloadIcon size={24} /> },
  ];

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
      features={features}
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
