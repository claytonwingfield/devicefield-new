"use client";

import { useId, useState } from "react";
import Link from "next/link";
import LoadingAnimation from "@/components/loading-animation";

export default function NewsletterForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const form = event.currentTarget;
    const honeypot = new FormData(form).get("company");

    let response: Response;
    try {
      response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          company: typeof honeypot === "string" ? honeypot : "",
          source: window.location.pathname,
        }),
      });
    } catch {
      setStatus("error");
      setMessage("Could not subscribe right now. Try again in a minute.");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok) {
      setStatus("error");
      setMessage(
        result?.message ??
          "Could not subscribe right now. Try again in a minute.",
      );
      return;
    }

    setEmail("");
    setStatus("success");
    setMessage(
      result?.message ?? "Check your inbox to confirm your subscription.",
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-3">
      <label
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        Company
        <input name="company" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
        <label className="sr-only" htmlFor={emailId}>
          Email address
        </label>
        <input
          id={emailId}
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
          {status === "loading" ? (
            <LoadingAnimation className="h-5 w-5" />
          ) : (
            "Subscribe"
          )}
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
      <p className="text-xs leading-5 text-zinc-400">
        By subscribing, you agree to receive Devicefield emails. Unsubscribe at
        any time. See our{" "}
        <Link
          href="/privacy"
          className="text-zinc-200 underline underline-offset-2 hover:text-white"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
