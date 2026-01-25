import ServiceLayout from "@/components/service-layout";

export const metadata = {
  title: "Website Development - DeviceField",
  description:
    "Professional website development services tailored to your business needs",
};

export default function WebsiteDevelopmentPage() {
  return (
    <ServiceLayout
      title="Website Development"
      description="We create robust, visually appealing websites customized to meet your unique business objectives. From initial design to full-scale deployment, we guarantee flawless performance, user-centric layouts, and adaptable solutions that enhance user engagement and foster business expansion."
      icon={
        <svg
          width={48}
          height={48}
          xmlns="http://www.w3.org/2000/svg"
          id="Html"
          x="0"
          y="0"
          enableBackground="new 0 0 48 48"
          version="1.1"
          viewBox="0 0 48 48"
        >
          <g fill="#000000" className="color000000 svgShape">
            <path
              fill="#ffeb3b"
              d="M24,47.5C11,47.5,0.5,37,0.5,24S11,0.5,24,0.5S47.5,11,47.5,24S37,47.5,24,47.5z M24,4.4   C13.2,4.4,4.4,13.2,4.4,24c0,10.8,8.8,19.6,19.6,19.6c10.8,0,19.6-8.8,19.6-19.6C43.6,13.2,34.8,4.4,24,4.4z"
              className="color010101 svgShape"
            ></path>
            <g fill="#000000" className="color000000 svgShape">
              <path
                fill="#ffeb3b"
                d="M29.2 33.2c-.5 0-1-.2-1.4-.6-.8-.8-.8-2 0-2.8l5.8-5.8-5.8-5.8c-.8-.8-.8-2 0-2.8.8-.8 2-.8 2.8 0l7.2 7.2c.8.8.8 2 0 2.8l-7.2 7.2C30.2 33 29.7 33.2 29.2 33.2zM18.8 33.2c-.5 0-1-.2-1.4-.6l-7.2-7.2c-.8-.8-.8-2 0-2.8l7.2-7.2c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8L14.3 24l5.8 5.8c.8.8.8 2 0 2.8C19.8 33 19.3 33.2 18.8 33.2z"
                className="color010101 svgShape"
              ></path>
            </g>
          </g>
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
        "Business websites and corporate portals",
        "E-commerce stores and online marketplaces",
        "Portfolio sites for creative professionals",
        "Blog and content publishing platforms",
        "Landing pages for marketing campaigns",
      ]}
    />
  );
}
