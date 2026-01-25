"use client";

import { useState } from "react";

export default function ProjectPlanner() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [selections, setSelections] = useState<{
    services: string[];
    type: string;
    budget: string;
    pricingModel: "monthly" | "yearly"; // New State
    timeline: string;
  }>({
    services: [],
    type: "",
    budget: "",
    pricingModel: "monthly", // Default to Monthly
    timeline: "",
  });

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Options Data
  const services = [
    { id: "web", label: "Website Development", icon: "🌐" },
    { id: "app", label: "Mobile App", icon: "📱" },
    { id: "api", label: "API Integration", icon: "🔌" },
    { id: "seo", label: "SEO & Performance", icon: "🚀" },
    { id: "design", label: "UI/UX Design", icon: "🎨" },
    { id: "analytics", label: "Analytics Setup", icon: "cA" },
  ];

  // Dynamic Budget Options
  const monthlyBudgets = [
    "< $100 /mo",
    "$100 - $500 /mo",
    "$500 - $1,000 /mo",
    "$1,000 - $5,000 /mo",
    "$5,000+ /mo",
  ];

  const yearlyBudgets = [
    "< $1,000 /yr",
    "$1,000 - $5,000 /yr",
    "$5,000 - $10,000 /yr",
    "$10,000 - $50,000 /yr",
    "$50,000+ /yr",
  ];

  const currentBudgets =
    selections.pricingModel === "monthly" ? monthlyBudgets : yearlyBudgets;

  const timelines = [
    "ASAP (< 1 month)",
    "1 - 3 months",
    "3 - 6 months",
    "Flexible",
  ];

  // Handlers
  const toggleService = (id: string) => {
    setSelections((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));
  };

  const handleNext = () => {
    // Validation
    if (step === 1 && selections.services.length === 0)
      return alert("Please select at least one service.");
    if (step === 2 && !selections.budget)
      return alert("Please select a budget range.");
    if (step === 3 && !selections.timeline)
      return alert("Please select a timeline.");

    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selections, contact }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setCompleted(true);
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="mx-auto max-w-xl text-center py-20" data-aos="zoom-y-out">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg
            className="h-10 w-10"
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
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Request Received!
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Thanks {contact.name}. We've received your project details and will be
          in touch shortly to discuss the next steps.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="btn bg-gray-900 text-white hover:bg-gray-800"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span className={step >= 1 ? "text-yellow-600" : ""}>Services</span>
          <span className={step >= 2 ? "text-yellow-600" : ""}>Budget</span>
          <span className={step >= 3 ? "text-yellow-600" : ""}>Timeline</span>
          <span className={step >= 4 ? "text-yellow-600" : ""}>Contact</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-yellow-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl md:p-12 transition-all">
        {/* Step 1: Services */}
        {step === 1 && (
          <div data-aos="fade-in">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              What are you looking to build?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`group flex flex-col items-center justify-center rounded-xl border p-6 transition-all ${
                    selections.services.includes(s.id)
                      ? "border-yellow-primary bg-yellow-50 ring-1 ring-yellow-primary"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="mb-3 text-3xl">{s.icon}</span>
                  <span className="font-medium text-gray-900">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div data-aos="fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Estimated Budget
              </h2>

              {/* Monthly / Yearly Toggle */}
              <div className="inline-flex rounded-lg bg-gray-100 p-1 self-start md:self-auto">
                <button
                  onClick={() => {
                    setSelections((prev) => ({
                      ...prev,
                      pricingModel: "monthly",
                      budget: "",
                    }));
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    selections.pricingModel === "monthly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => {
                    setSelections((prev) => ({
                      ...prev,
                      pricingModel: "yearly",
                      budget: "",
                    }));
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    selections.pricingModel === "yearly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {currentBudgets.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelections({ ...selections, budget: b })}
                  className={`flex w-full items-center justify-between rounded-xl border px-6 py-4 transition-all ${
                    selections.budget === b
                      ? "border-yellow-primary bg-yellow-50 ring-1 ring-yellow-primary"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium text-gray-900">{b}</span>
                  <div
                    className={`h-5 w-5 rounded-full border ${selections.budget === b ? "border-yellow-600 bg-yellow-primary" : "border-gray-300"}`}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Timeline */}
        {step === 3 && (
          <div data-aos="fade-in">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              When do you need this completed?
            </h2>
            <div className="space-y-3">
              {timelines.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelections({ ...selections, timeline: t })}
                  className={`flex w-full items-center justify-between rounded-xl border px-6 py-4 transition-all ${
                    selections.timeline === t
                      ? "border-yellow-primary bg-yellow-50 ring-1 ring-yellow-primary"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium text-gray-900">{t}</span>
                  <div
                    className={`h-5 w-5 rounded-full border ${selections.timeline === t ? "border-yellow-600 bg-yellow-primary" : "border-gray-300"}`}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <form onSubmit={handleSubmit} data-aos="fade-in">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Last step! How can we reach you?
            </h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    required
                    className="form-input w-full"
                    type="text"
                    placeholder="John Doe"
                    value={contact.name}
                    onChange={(e) =>
                      setContact({ ...contact, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    required
                    className="form-input w-full"
                    type="email"
                    placeholder="john@company.com"
                    value={contact.email}
                    onChange={(e) =>
                      setContact({ ...contact, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  className="form-input w-full"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={contact.phone}
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Additional Details
                </label>
                <textarea
                  className="form-textarea w-full"
                  rows={3}
                  placeholder="Anything else we should know?"
                  value={contact.message}
                  onChange={(e) =>
                    setContact({ ...contact, message: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-gray-500 hover:text-gray-900 font-medium px-4 py-2"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn bg-gray-900 text-white hover:bg-gray-800 shadow-lg px-8"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn bg-yellow-primary text-gray-900 hover:bg-yellow-400 shadow-lg px-8 font-bold"
            >
              {loading ? "Submitting..." : "Get My Quote"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
