"use client";

import { useState } from "react";
import LoadingAnimation from "@/components/loading-animation";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: normalizedEmail,
      source: typeof window === "undefined" ? "site" : window.location.pathname,
    });

    if (error && error.code !== "23505") {
      setStatus("error");
      setMessage("Could not subscribe right now. Try again in a minute.");
      return;
    }

    setEmail("");
    setStatus("success");
    setMessage("You're on the list.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="form-input min-w-0 flex-1 rounded-full border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-lime-300"
          placeholder="you@company.com"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? <LoadingAnimation className="h-5 w-5" /> : "Subscribe"}
        </button>
      </div>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-300" : "text-lime-200"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
