"use client";

import { useState } from "react";

interface ContactFormProps {
  serviceName?: string;
  onSubmit?: () => void;
}

export default function ContactForm({ serviceName, onSubmit }: ContactFormProps) {
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Thank you! We'll get back to you soon.
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
        <button
          type="submit"
          disabled={loading}
          className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
