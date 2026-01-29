import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Devicefield",
  description: "Read our terms of service",
};

export default function Terms() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero Section - Matching Services Style */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          <div className="grid gap-12 lg:grid-cols-1 lg:gap-8 items-center">
            {/* Left Column: Text */}
            <div className="text-center" data-aos="fade-right">
              {/* Mobile Icon (visible only on small screens, matching service layout pattern) */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-primary/10 text-yellow-primary lg:hidden">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight">
                Terms of Service
              </h1>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Please read these terms carefully before using our services.
                They outline the rules and regulations for the use of
                Devicefield's Website and Services.
              </p>

              <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Right Column: Visual */}
          </div>
        </div>

        {/* Content Section */}
        <div className="mb-20 max-w-4xl mx-auto">
          <div
            className="prose max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-blue-primary hover:prose-a:text-blue-primary"
            data-aos="fade-up"
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
              personal, non-commercial transitory viewing only. This is the
              grant of a license, not a transfer of title, and under this
              license you may not:
            </p>
            <ul>
              <li>modify or copy the materials;</li>
              <li>
                use the materials for any commercial purpose, or for any public
                display (commercial or non-commercial);
              </li>
              <li>
                attempt to decompile or reverse engineer any software contained
                on Devicefield's website;
              </li>
              <li>
                remove any copyright or other proprietary notations from the
                materials; or
              </li>
              <li>
                transfer the materials to another person or "mirror" the
                materials on any other server.
              </li>
            </ul>

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

            <h3>4. Limitations</h3>
            <p>
              In no event shall Devicefield or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on Devicefield's website.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
