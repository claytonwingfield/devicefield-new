import ServiceLayout from "@/components/service-layout";
import { ApiVisual } from "@/components/service-visuals";

export const metadata = {
  title: "API Development - DeviceField",
  description: "Robust and scalable APIs for seamless application integration",
};

export default function APIDevelopmentPage() {
  return (
    <ServiceLayout
      title="API Development"
      description="We offer robust and scalable APIs that enable seamless integration between your applications and third-party services, ensuring efficient data exchange, enhanced functionality, and secure communication channels."
      visual={<ApiVisual />}
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      }
      features={[
        "RESTful & GraphQL APIs",
        "API Documentation",
        "Authentication & Security",
        "Rate Limiting",
        "Versioning",
        "Testing & Monitoring",
      ]}
      benefits={[
        "RESTful and GraphQL APIs for flexible data access",
        "Comprehensive documentation for easy integration",
        "Enterprise-grade security with authentication",
        "Built-in rate limiting to prevent abuse",
        "Version management for smooth updates",
        "Continuous monitoring and performance optimization",
      ]}
      useCases={[
        "Third-party integrations",
        "Microservices",
        "Mobile backends",
        "Data aggregation",
        "Payment processing",
      ]}
    />
  );
}
