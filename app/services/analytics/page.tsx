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
    {
      title: "Real-Time Tracking",
      description:
        "Monitor visitor activity as it happens. Watch live user counts and immediate interactions to react to trends instantly.",
      icon: <ClockIcon size={24} />,
    },
    {
      title: "Page View Analytics",
      description:
        "Dive deep into specific page performance. Identify your top-performing content and pinpoint areas with high exit rates.",
      icon: <ChartColumnIncreasingIcon size={24} />,
    },
    {
      title: "User Behavior Insights",
      description:
        "Understand the 'why' behind the clicks. Analyze navigation paths, scroll depth, and interaction heatmaps to optimize UX.",
      icon: <CursorClickIcon size={24} />,
    },
    {
      title: "Traffic Sources",
      description:
        "Know exactly where your audience comes from—whether it's organic search, social media, or referral links—to optimize marketing spend.",
      icon: <EarthIcon size={24} />,
    },
    {
      title: "Custom Dashboards",
      description:
        "Tailor your view to focus on the KPIs that matter most to your business. Create drag-and-drop widgets for a personalized command center.",
      icon: <GalleryThumbnailsIcon size={24} />,
    },
    {
      title: "Export & Reporting",
      description:
        "Generate professional reports in PDF or CSV formats automatically. Schedule delivery to stakeholders to keep everyone aligned.",
      icon: <HardDriveDownloadIcon size={24} />,
    },
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
