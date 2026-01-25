export const metadata = { title: "Terms of Service - Devicefield" };

export default function Terms() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Header */}
          <div
            className="mb-8 border-b border-gray-200 pb-8"
            data-aos="fade-up"
          >
            <h1 className="h2 mb-4">Terms of Service</h1>
            <p className="text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div
            className="prose max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-500"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p>
              Welcome to Devicefield. By using our website and services, you
              agree to comply with and be bound by the following terms and
              conditions.
            </p>

            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using our Service, you agree to be bound by these
              Terms. If you disagree with any part of the terms, then you may
              not access the Service.
            </p>

            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily download one copy of the
              materials (information or software) on Devicefield's website for
              personal, non-commercial transitory viewing only.
            </p>

            <h3>3. Disclaimer</h3>
            <p>
              The materials on Devicefield's website are provided on an 'as is'
              basis. Devicefield makes no warranties, expressed or implied, and
              hereby disclaims and negates all other warranties including,
              without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </p>

            {/* Add more sections as needed */}
          </div>
        </div>
      </div>
    </section>
  );
}
