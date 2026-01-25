import ServiceLayout from "@/components/service-layout";

export const metadata = {
  title: "API Development - DeviceField",
  description:
    "Robust and scalable APIs for seamless application integration",
};

export default function APIDevelopmentPage() {
  return (
    <ServiceLayout
      title="API Development"
      description="We offer robust and scalable APIs that enable seamless integration between your applications and third-party services, ensuring efficient data exchange, enhanced functionality, and secure communication channels."
      icon={
        <svg
          width={48}
          height={48}
          xmlns="http://www.w3.org/2000/svg"
          enableBackground="new 0 0 64 64"
          viewBox="0 0 64 64"
          id="Api"
        >
          <path
            d="M50.272,20.325c-0.222-5.283-4.548-9.512-9.835-9.512c-1.688,0-3.323,0.438-4.795,1.276C33.246,9.475,29.935,8,26.375,8
		c-6.838,0-12.426,5.491-12.649,12.326C10.262,21.953,8,25.394,8,29.187c0,4.978,3.749,9.104,8.598,9.754
		c0.079,0.795,0.229,1.605,0.453,2.443l-1.774,1.025c-0.672,0.388-0.903,1.248-0.515,1.921l2.813,4.871
		c0.388,0.672,1.248,0.903,1.921,0.515l1.779-1.027c1.861,1.822,4.078,3.123,6.507,3.817v2.088c0,0.777,0.629,1.406,1.406,1.406
		h5.625c0.777,0,1.406-0.629,1.406-1.406v-2.088c2.429-0.694,4.646-1.995,6.507-3.817l1.779,1.027
		c0.672,0.388,1.533,0.158,1.921-0.515l2.812-4.871c0.388-0.673,0.158-1.533-0.515-1.921l-1.774-1.025
		c0.224-0.837,0.374-1.647,0.453-2.443C52.25,38.291,56,34.165,56,29.187C56,25.394,53.737,21.952,50.272,20.325L50.272,20.325z
		 M44.693,46.577l-1.519-0.876c-0.578-0.334-1.311-0.215-1.754,0.284c-1.871,2.106-4.253,3.504-6.889,4.041
		c-0.655,0.133-1.125,0.709-1.125,1.378v1.784h-2.812v-1.784c0-0.668-0.47-1.245-1.125-1.378c-2.635-0.537-5.017-1.935-6.889-4.041
		c-0.443-0.499-1.176-0.618-1.754-0.284l-1.518,0.876l-1.406-2.436l1.521-0.878c0.579-0.334,0.842-1.03,0.63-1.664
		c-0.301-0.9-0.504-1.75-0.613-2.568h2.818c0.684,4.764,4.792,8.438,9.743,8.438c4.951,0,9.059-3.673,9.743-8.438h2.818
		c-0.109,0.819-0.312,1.669-0.613,2.569c-0.212,0.634,0.052,1.33,0.63,1.664l1.521,0.878L44.693,46.577z M25.11,39.03H38.89
		c-0.653,3.207-3.494,5.626-6.89,5.626C28.604,44.656,25.764,42.237,25.11,39.03L25.11,39.03z M46.062,36.219H17.938
		c-3.929,0-7.125-3.154-7.125-7.031c0-2.947,1.939-5.602,4.826-6.608c0.587-0.205,0.97-0.77,0.943-1.39
		c-0.006-0.145-0.025-0.271-0.038-0.362c-0.004-0.03-0.01-0.069-0.012-0.088c0.006-5.475,4.419-9.926,9.844-9.926
		c3.105,0,5.971,1.452,7.862,3.983c0.224,0.3,0.559,0.499,0.93,0.551c0.371,0.053,0.748-0.045,1.046-0.272
		c1.25-0.948,2.711-1.449,4.224-1.449c3.874,0,7.027,3.192,7.031,7.117c-0.002,0.02-0.008,0.066-0.013,0.1
		c-0.012,0.087-0.027,0.196-0.035,0.324c-0.038,0.628,0.347,1.205,0.941,1.412c2.886,1.006,4.826,3.661,4.826,6.608
		C53.188,33.064,49.991,36.219,46.062,36.219L46.062,36.219z"
            fill="#ffeb3b"
            className="color000000 svgShape"
          ></path>
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
        "Third-party service integrations",
        "Microservices architecture",
        "Mobile app backends",
        "Data aggregation platforms",
        "Payment processing systems",
      ]}
    />
  );
}
