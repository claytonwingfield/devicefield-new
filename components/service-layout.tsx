import ContactForm from "./contact-form";

interface ServiceLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  benefits: string[];
  useCases?: string[];
  children?: React.ReactNode;
}

export default function ServiceLayout({
  title,
  description,
  icon,
  features,
  benefits,
  useCases,
  children,
}: ServiceLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero Section */}
      <div className="pb-12 pt-32 md:pb-20 md:pt-40">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            {icon}
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-700">
            {description}
          </p>
        </div>
      </div>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Key Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="mb-2 font-semibold text-gray-900">{feature}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Benefits</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <svg
                className="mt-1 h-6 w-6 shrink-0 text-yellow-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-gray-700">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section (Optional) */}
      {useCases && useCases.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Use Cases</h2>
          <div className="space-y-4">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6"
              >
                <p className="text-gray-700">{useCase}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Content */}
      {children}

      {/* Contact Section */}
      <section className="mb-16 rounded-2xl border border-gray-200 bg-gray-50 p-8 md:p-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-bold">
            Request More Information
          </h2>
          <p className="mb-8 text-center text-gray-600">
            Fill out the form below and we'll get back to you within 24 hours.
          </p>
          <ContactForm serviceName={title} />
        </div>
      </section>
    </div>
  );
}
