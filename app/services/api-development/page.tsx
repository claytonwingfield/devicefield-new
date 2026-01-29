import ServiceLayout, { FeatureItem } from "@/components/service-layout";
import { ApiVisual } from "@/components/service-visuals";
import { GitBranchIcon } from "@/components/ui/git-branch";
import { BookTextIcon } from "@/components/ui/book-text";
import { LockKeyholeIcon } from "@/components/ui/lock-keyhole";
import { BadgeAlertIcon } from "@/components/ui/badge-alert";
import { FileStackIcon } from "@/components/ui/file-stack";
import { CctvIcon } from "@/components/ui/cctv";

export const metadata = {
  title: "API Development - DeviceField",
  description: "Robust and scalable APIs for seamless application integration",
};

export default function APIDevelopmentPage() {
  const features: FeatureItem[] = [
    { title: "RESTful & GraphQL APIs", icon: <GitBranchIcon size={24} /> },
    { title: "API Documentation", icon: <BookTextIcon size={24} /> },
    { title: "Authentication & Security", icon: <LockKeyholeIcon size={24} /> },
    { title: "Rate Limiting", icon: <BadgeAlertIcon size={24} /> },
    { title: "Versioning", icon: <FileStackIcon size={24} /> },
    { title: "Testing & Monitoring", icon: <CctvIcon size={24} /> },
  ];

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
      features={features}
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
