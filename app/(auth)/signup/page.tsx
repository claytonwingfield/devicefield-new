"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LoadingAnimation from "@/components/loading-animation";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess(true);
        // Redirect to sign in after a moment
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || "An error occurred during GitHub sign up");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Create your account</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSignUp}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            Account created successfully! Check your email to verify your
            account, then sign in.
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="name"
            >
              Full name
            </label>
            <input
              id="name"
              className="form-input w-full py-2"
              type="text"
              placeholder="Corey Barker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              id="phone"
              className="form-input w-full py-2"
              type="text"
              placeholder="(+750) 932-8907"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              className="form-input w-full py-2"
              type="password"
              autoComplete="on"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-loading w-full bg-gradient-to-t from-blue-primary to-blue-primary bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex size-10 items-center justify-center shrink-0">
                <LoadingAnimation className="h-10 w-10" />
              </span>
            ) : (
              "Register"
            )}
          </button>
          {/* <div className="text-center text-sm italic text-gray-400">Or</div>
          <button
            type="button"
            onClick={handleGitHubSignUp}
            disabled={loading}
            className="btn w-full bg-gradient-to-t from-gray-900 to-gray-700 bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with GitHub
          </button> */}
        </div>
      </form>

      {/* Bottom link */}
      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            className="font-medium text-gray-700 underline hover:no-underline"
            href="/signin"
          >
            Sign in
          </Link>
        </p>
        <p className="text-sm text-gray-500">
          By signing up, you agree to the{" "}
          <Link
            className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline"
            href="/terms"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline"
            href="/terms"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </>
  );
}
