// app/schedule/page.tsx
"use client";

import { useState } from "react";
import LoadingAnimation from "@/components/loading-animation";
import { format } from "date-fns";

export default function SchedulePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Combine date and time
    const startTime = new Date(`${formData.date}T${formData.time}`);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          notes: formData.notes,
          startTime: startTime.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setMeetingLink(data.meetingLink);
    } catch (error) {
      alert("Failed to schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-lg rounded-2xl border border-green-100 bg-green-50 p-8 text-center shadow-lg">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              className="h-8 w-8"
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
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Meeting Scheduled!
          </h2>
          <p className="mb-6 text-gray-600">
            A calendar invite and Google Meet link have been sent to your email.
          </p>
          {meetingLink && (
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-blue-primary text-white hover:bg-blue-primary/90"
            >
              Join Meeting Link
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="relative">
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="mb-4 text-4xl font-bold">Book an Intro Call</h1>
          <p className="text-lg text-gray-600">
            Select a time to chat about your project requirements.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  className="form-input w-full"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  className="form-input w-full"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  required
                  type="date"
                  className="form-input w-full"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Time
                </label>
                <input
                  required
                  type="time"
                  className="form-input w-full"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Topic / Notes
              </label>
              <textarea
                className="form-textarea w-full"
                rows={3}
                placeholder="What would you like to discuss?"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-loading w-full bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
            >
              {loading ? (
                <span className="inline-flex size-10 items-center justify-center shrink-0">
                  <LoadingAnimation className="h-10 w-10" />
                </span>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
