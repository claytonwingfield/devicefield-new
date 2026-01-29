"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./logo";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Shared transition configuration for perfect synchronization
  const smoothTransition = {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1], // Custom "Material Design" style ease-in-out
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50) {
        setIsScrolledDown(currentScrollY > lastScrollY);
      } else {
        setIsScrolledDown(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) checkAdminStatus(user.id);
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) checkAdminStatus(currentUser.id);
      else setIsAdmin(false);
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
    <header className="fixed top-2 z-30 w-full md:top-6 pointer-events-none">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={false}
          animate={{
            width: isScrolledDown ? "65px" : "100%",
          }}
          // UPDATED: Slower duration (0.5s) and custom ease for "premium" feel
          transition={smoothTransition}
          className={`relative pointer-events-auto flex h-14 items-center rounded-2xl bg-white/90 shadow-lg shadow-black/[0.03] backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(theme(colors.gray.100),theme(colors.gray.200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] ${
            isScrolledDown ? "px-3 ml-0 mr-auto" : "px-3 w-full justify-between"
          }`}
          style={{ overflow: "visible" }}
        >
          {/* Logo Container */}
          <div className="flex items-center justify-center shrink-0 z-10">
            <Logo />
          </div>

          {/* Navigation Section */}
          <AnimatePresence>
            {!isScrolledDown && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                // UPDATED: Matches the container's transition exactly
                transition={smoothTransition}
                className="flex items-center overflow-hidden whitespace-nowrap"
              >
                <ul className="flex items-center justify-end gap-3 pl-3 min-w-max">
                  {user ? (
                    <>
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
                      <li>
                        <Link
                          href="/dashboard"
                          className="btn-sm bg-yellow-primary/70 text-black shadow hover:bg-yellow-primary/90 border border-gray-200"
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleSignOut}
                          className="btn-sm bg-red-500 text-white shadow  "
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
                          className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50 border border-gray-200"
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}
