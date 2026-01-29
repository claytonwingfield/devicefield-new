"use client";

import { useState } from "react";
import LoadingAnimation from "@/components/loading-animation";

interface ContactFormProps {
  serviceName?: string;
  onSubmit?: () => void;
}

export default function ContactForm({
  serviceName,
  onSubmit,
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    service: serviceName || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: "",
        service: serviceName || "",
      });

      if (onSubmit) {
        onSubmit();
      }

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* SUCCESS OVERLAY */}
      {/* This sits on top of the form. It is invisible until success is true. */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm transition-all duration-500 ease-in-out ${
          success
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="rounded-lg bg-green-50 p-8 text-center text-green-700 shadow-sm border border-green-100">
          <svg
            className="mx-auto h-12 w-12 text-green-600 mb-4"
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
          <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
          <p className="font-medium">
            Thank you, please check your email. <br /> We will reach back out
            shortly.
          </p>
        </div>
      </div>

      {/* FORM */}
      {/* We change opacity to 0 on success, but keep 'block' so height remains stable */}
      <form
        onSubmit={handleSubmit}
        className={`space-y-4 transition-opacity duration-500 ease-in-out ${
          success ? "opacity-20 pointer-events-none" : "opacity-100"
        }`}
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="name"
            >
              Full Name *
            </label>
            <input
              id="name"
              name="name"
              className="form-input w-full py-2"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Email *
            </label>
            <input
              id="email"
              name="email"
              className="form-input w-full py-2"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              className="form-input w-full py-2"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="company"
            >
              Company
            </label>
            <input
              id="company"
              name="company"
              className="form-input w-full py-2"
              type="text"
              placeholder="Company Name"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
        </div>

        {!serviceName && (
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="service"
            >
              Service Interest
            </label>
            <select
              id="service"
              name="service"
              className="form-select w-full py-2"
              value={formData.service}
              onChange={handleChange}
            >
              <option value="">Select a service</option>
              <option value="Website Development">Website Development</option>
              <option value="App Development">App Development</option>
              <option value="API Development">API Development</option>
              <option value="Instant Analytics">Instant Analytics</option>
              <option value="Metadata">Metadata</option>
              <option value="SEO & Performance">SEO & Performance</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        <div>
          <label
            className="mb-1 block text-sm font-medium text-gray-700"
            htmlFor="message"
          >
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            className="form-textarea w-full py-2"
            rows={5}
            placeholder="Tell us about your project..."
            value={formData.message}
            onChange={handleChange}
            required
          />
        </div>

        <div>
        {loading ? (
          <div className="flex h-12 items-center justify-center" aria-hidden="true">
            <LoadingAnimation
              className="h-10 w-10"
              fallback={<span className="text-gray-500">Sending...</span>}
            />
            </div>
          ) : (
            <button
              type="submit"
              className="btn w-full bg-gradient-to-t from-blue-primary to-blue-primary bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%]"
            >
              Send Message
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
