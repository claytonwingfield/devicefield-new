import ServiceLayout from "@/components/service-layout";
import { AppVisual } from "@/components/service-visuals";

export const metadata = {
  title: "App Development - DeviceField",
  description:
    "High-performance mobile applications for iOS and Android platforms",
};

export default function AppDevelopmentPage() {
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
      features={[
        "iOS & Android Development",
        "Native & Cross-Platform",
        "App Store Optimization",
        "Push Notifications",
        "Offline Functionality",
        "Analytics Integration",
      ]}
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
