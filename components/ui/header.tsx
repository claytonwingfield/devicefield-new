"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added for redirect
import Logo from "./logo";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        checkAdminStatus(user.id);
      }
    };

    const checkAdminStatus = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      setIsAdmin(profile?.role === "admin");
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        checkAdminStatus(currentUser.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push("/signin");
    router.refresh();
  };

  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 shadow-lg shadow-black/[0.03] backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(theme(colors.gray.100),theme(colors.gray.200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            <Logo />
          </div>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            {user ? (
              <>
                {/* Admin Button (Left of Dashboard) */}
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      className="btn-sm bg-black text-white shadow hover:bg-black/90"
                    >
                      Admin
                    </Link>
                  </li>
                )}

                {/* Dashboard Button */}
                <li>
                  <Link
                    href="/dashboard"
                    className="btn-sm bg-gray-900 text-white shadow hover:bg-gray-800"
                  >
                    Dashboard
                  </Link>
                </li>

                {/* Sign Out Button (Right of Dashboard) */}
                <li>
                  <button
                    onClick={handleSignOut}
                    className="btn-sm bg-white text-red-600 shadow hover:bg-gray-50 border border-gray-200"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/signin"
                    className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="btn-sm bg-black text-gray-200 shadow hover:bg-gray-900"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
}
