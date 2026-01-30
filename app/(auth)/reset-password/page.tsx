"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingAnimation from "@/components/loading-animation";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Redirect to callback first, then to the confirm page
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/confirm`,
    });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "An error occurred while resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Reset password</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleResetPassword}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            Check your email for a password reset link.
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              className="form-input w-full py-2"
              type="email"
              placeholder="corybarker@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading || success}
            className="btn btn-loading w-full bg-gradient-to-t from-blue-primary to-blue-primary bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex size-10 items-center justify-center shrink-0">
                <LoadingAnimation className="h-10 w-10" />
              </span>
            ) : success ? (
              "Email Sent"
            ) : (
              "Reset Password"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
