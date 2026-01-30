import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { AppVisual } from "@/components/service-visuals";
import { GripIcon } from "@/components/ui/grip";
import { RouteIcon } from "@/components/ui/route";
import { ScanFaceIcon } from "@/components/ui/scan-face";
import { BellIcon } from "@/components/ui/bell";
import { RefreshCWOffIcon } from "@/components/ui/refresh-cw-off";
import { ChartLineIcon } from "@/components/ui/chart-line";

export const metadata = {
  title: "App Development - DeviceField",
  description:
    "High-performance mobile applications for iOS and Android platforms",
};

export default function AppDevelopmentPage() {
  const features: FeatureItem[] = [
    {
      title: "iOS & Android Development",
      description:
        "We build high-quality mobile experiences tailored for the Apple App Store and Google Play Store ecosystems.",
      icon: <GripIcon size={24} />,
    },
    {
      title: "Native & Cross-Platform",
      description:
        "Choose between pure Native code for max performance or React Native/Flutter for faster deployment across both platforms.",
      icon: <RouteIcon size={24} />,
    },
    {
      title: "App Store Optimization",
      description:
        "We handle the submission process and optimize listings with keywords and visuals to increase organic downloads.",
      icon: <ScanFaceIcon size={24} />,
    },
    {
      title: "Push Notifications",
      description:
        "Re-engage users instantly. Send targeted alerts, updates, and promotions directly to their device lock screens.",
      icon: <BellIcon size={24} />,
    },
    {
      title: "Offline Functionality",
      description:
        "Ensure your app remains usable without an internet connection by implementing local caching and data synchronization.",
      icon: <RefreshCWOffIcon size={24} />,
    },
    {
      title: "Analytics Integration",
      description:
        "Track user retention, crash reports, and engagement metrics to continuously improve the app experience.",
      icon: <ChartLineIcon size={24} />,
    },
  ];

  return (
    <ServiceLayout
      title="App Development"
      description="We build high-performance, user-friendly mobile applications tailored to your business needs. From concept to deployment, we ensure seamless functionality, intuitive interfaces, and scalable solutions that drive engagement."
      visual={<AppVisual />}
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
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      }
      features={features}
      benefits={[
        "Native performance with smooth user experience",
        "Cross-platform solutions reducing development time and cost",
        "Expert guidance through app store submission process",
        "Real-time engagement through push notifications",
        "Works seamlessly even without internet connection",
        "Data-driven insights to improve user engagement",
      ]}
      useCases={[
        "Business productivity",
        "Shopping applications",
        "Social networking",
        "Fitness tracking",
        "On-demand services",
      ]}
    />
  );
}
