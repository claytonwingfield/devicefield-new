"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check if we have the necessary tokens in the URL
    const code = searchParams.get("code");
    if (!code) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      router.push("/signin");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "An error occurred while updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Set new password</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdatePassword}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              New Password
            </label>
            <input
              id="password"
              className="form-input w-full py-2"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              className="form-input w-full py-2"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </>
  );
}
