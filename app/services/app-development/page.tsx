import ServiceLayout from "@/components/service-layout";

export const metadata = {
  title: "App Development - DeviceField",
  description:
    "High-performance mobile applications for iOS and Android platforms",
};

export default function AppDevelopmentPage() {
  return (
    <ServiceLayout
      title="App Development"
      description="We build high-performance, user-friendly mobile applications tailored to your business needs. From concept to deployment, we ensure seamless functionality, intuitive interfaces, and scalable solutions that drive engagement and growth."
      icon={
        <svg
          width={48}
          height={48}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          id="app"
        >
          <path
            fill="#ffeb3b"
            d="M81.19 42.0925v39h-39v-39h39m13-13h-65v65h65v-65zM157.6076 42.0925v39h-39v-39h39m13-13h-65v65h65v-65zM81.19 118.51v39h-39v-39h39m13-13h-65v65h65v-65zM157.6076 118.51v39h-39v-39h39m13-13h-65v65h65v-65z"
            className="color050b1e svgShape"
          ></path>
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
        "Business productivity apps",
        "E-commerce and shopping applications",
        "Social networking platforms",
        "Fitness and health tracking apps",
        "On-demand service applications",
      ]}
    />
  );
}
