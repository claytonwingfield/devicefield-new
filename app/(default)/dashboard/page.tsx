"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUserProjects = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchUserProjects();
  }, [router, supabase]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return alert("Please select a project");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("project_requests").insert([
      {
        project_id: selectedProject,
        user_id: user?.id,
        message: requestMessage,
      },
    ]);

    if (error) {
      alert("Error sending request.");
    } else {
      alert("Request sent successfully!");
      setRequestMessage("");
      setSelectedProject("");
    }
  };

  const getDatabaseLink = (url: string) => {
    if (!url) return "";
    if (url.includes("supabase.com/dashboard")) return url;
    if (url.includes(".supabase.co")) {
      const matches = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
      if (matches && matches[1]) {
        return `https://supabase.com/dashboard/project/${matches[1]}`;
      }
    }
    return url;
  };

  if (loading)
    return <div className="pt-32 text-center">Loading Dashboard...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 sm:px-6 mb-20">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Projects</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Start New Project Card */}
        <div className="flex flex-col justify-center items-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 shadow-sm transition hover:border-blue-500 hover:bg-blue-50 group cursor-pointer h-full min-h-[300px]">
          <Link
            href="/create-project"
            className="flex flex-col items-center justify-center w-full h-full text-center"
          >
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm group-hover:scale-110 transition-transform">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Start a New Project
            </h3>
            <p className="text-sm text-gray-500">
              Launch a new website, app, or integration.
            </p>
          </Link>
        </div>

        {/* Existing Projects */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md h-full min-h-[300px]"
          >
            <Link
              href={`/dashboard/project/${project.id}`}
              className="block group"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  {project.status}
                </span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600">
                {project.name}
              </h2>
              <p className="mb-4 text-sm text-gray-500 line-clamp-3">
                {project.description || "No description provided."}
              </p>

              <div className="mb-4 rounded-lg bg-gray-50 p-3 group-hover:bg-blue-50 transition-colors">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="block font-bold text-gray-900">
                      {project.analytics_data?.views || 0}
                    </span>
                    <span className="text-gray-500">Views</span>
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900">
                      {project.analytics_data?.clicks || 0}
                    </span>
                    <span className="text-gray-500">Clicks</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="mt-auto flex flex-col gap-2">
              <Link
                href={`/dashboard/project/${project.id}`}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Dashboard
              </Link>

              <div className="flex gap-2">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Visit Site
                  </a>
                )}

                {project.database_url && (
                  <a
                    href={getDatabaseLink(project.database_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-blue-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-primary/80"
                  >
                    Database
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ... Request Changes Modal ... */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Request Changes</h3>
            <form onSubmit={handleRequestSubmit}>
              <textarea
                className="form-textarea mb-4 w-full rounded-lg border-gray-300"
                rows={4}
                placeholder="Describe the changes you need..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProject("")}
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
