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
    { title: "iOS & Android Development", icon: <GripIcon size={24} /> },
    { title: "Native & Cross-Platform", icon: <RouteIcon size={24} /> },
    { title: "App Store Optimization", icon: <ScanFaceIcon size={24} /> },
    { title: "Push Notifications", icon: <BellIcon size={24} /> },
    { title: "Offline Functionality", icon: <RefreshCWOffIcon size={24} /> },
    { title: "Analytics Integration", icon: <ChartLineIcon size={24} /> },
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
