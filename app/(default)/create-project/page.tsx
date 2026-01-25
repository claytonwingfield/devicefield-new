"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProjectPlanner from "@/components/project-planner";

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, [router, supabase]);

  if (loading) return <div className="pt-32 text-center">Loading...</div>;

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h1 className="h2 mb-4">Start a New Project</h1>
            <p className="text-xl text-gray-600">
              Tell us about your next big idea. We'll get straight to work on a
              strategy.
            </p>
          </div>

          <ProjectPlanner isAuthFlow={true} user={user} />
        </div>
      </div>
    </section>
  );
}
