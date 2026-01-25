import ServiceLayout from "@/components/service-layout";
import { WebsiteVisual } from "@/components/service-visuals";

export const metadata = {
  title: "Website Development - DeviceField",
  description:
    "Professional website development services tailored to your business needs",
};

export default function WebsiteDevelopmentPage() {
  return (
    <ServiceLayout
      title="Website Development"
      description="We create robust, visually appealing websites customized to meet your unique business objectives. From initial design to full-scale deployment, we guarantee flawless performance, user-centric layouts, and adaptable solutions."
      visual={<WebsiteVisual />}
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
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      }
      features={[
        "Responsive Design",
        "Modern UI/UX",
        "Performance Optimization",
        "SEO-Friendly",
        "Content Management",
        "E-commerce Integration",
      ]}
      benefits={[
        "Custom solutions tailored to your brand and business goals",
        "Mobile-first approach ensuring perfect display on all devices",
        "Fast loading times and optimized performance",
        "Search engine optimization built-in from the start",
        "Easy-to-use content management for non-technical users",
        "Scalable architecture that grows with your business",
      ]}
      useCases={[
        "Business websites",
        "E-commerce stores",
        "Portfolio sites",
        "Blogs",
        "Landing pages",
      ]}
    />
  );
}
