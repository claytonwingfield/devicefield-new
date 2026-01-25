"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// Mock data for the chart to simulate the "dashboard" look
const MOCK_CHART_DATA = [
  { day: "Mon", views: 120 },
  { day: "Tue", views: 145 },
  { day: "Wed", views: 200 },
  { day: "Thu", views: 180 },
  { day: "Fri", views: 250 },
  { day: "Sat", views: 190 },
  { day: "Sun", views: 210 },
];

export default function ProjectDetails() {
  const [project, setProject] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState("");

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }

      // 1. Fetch Project Details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError || !projectData) {
        router.push("/dashboard");
        return;
      }

      // 2. Fetch Project Requests
      const { data: requestsData } = await supabase
        .from("project_requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      setProject(projectData);
      if (requestsData) setRequests(requestsData);
      setLoading(false);
    };

    if (projectId) fetchData();
  }, [projectId, router, supabase]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("project_requests")
      .insert([
        {
          project_id: projectId,
          user_id: user?.id,
          message: newRequest,
          status: "open",
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setRequests([data, ...requests]);
      setNewRequest("");
    }
  };

  // Helper to fix the Supabase link on the fly
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
    return <div className="pt-32 text-center">Loading Project...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 sm:px-6 mb-20">
      {/* Header / Breadcrumbs */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
        >
          <svg
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="mt-4 flex gap-3 md:mt-0">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sm border border-gray-200 bg-white text-gray-700 shadow hover:bg-gray-50"
              >
                Visit Site
                <svg
                  className="ml-2 h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}

            {/* Added Database Button */}
            {project.database_url && (
              <a
                href={getDatabaseLink(project.database_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sm border border-green-200 bg-green-50 text-green-700 shadow hover:bg-green-100"
              >
                Database
                <svg
                  className="ml-2 h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </a>
            )}

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                project.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout (Same as before) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* KPI Card 1: Total Views */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
            <span className="rounded-full bg-blue-50 p-2 text-blue-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">
              {project.analytics_data?.views || 0}
            </p>
            <span className="ml-2 text-sm font-medium text-green-600">
              +12%{" "}
              <span className="text-gray-400 font-normal">vs last week</span>
            </span>
          </div>
        </div>

        {/* KPI Card 2: Clicks */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <span className="rounded-full bg-purple-50 p-2 text-purple-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">
              {project.analytics_data?.clicks || 0}
            </p>
            <span className="ml-2 text-sm font-medium text-green-600">
              +5%{" "}
              <span className="text-gray-400 font-normal">vs last week</span>
            </span>
          </div>
        </div>

        {/* KPI Card 3: Engagement (Mocked calculation) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">
              Avg. Engagement
            </h3>
            <span className="rounded-full bg-yellow-50 p-2 text-yellow-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">2m 14s</p>
            <span className="ml-2 text-sm font-medium text-gray-500">
              0% <span className="text-gray-400 font-normal">vs last week</span>
            </span>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Traffic Overview</h3>
            <select className="form-select rounded-lg border-gray-200 py-1 text-sm text-gray-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="flex h-64 items-end justify-between gap-2">
            {MOCK_CHART_DATA.map((item, i) => (
              <div
                key={i}
                className="group relative flex w-full flex-col items-center"
              >
                <div className="absolute -top-10 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {item.views} Views
                </div>
                <div
                  className="w-full max-w-[40px] rounded-t-lg bg-gray-900 opacity-80 transition-all hover:bg-blue-600 hover:opacity-100"
                  style={{ height: `${(item.views / 250) * 100}%` }}
                ></div>
                <span className="mt-2 text-xs text-gray-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Request/Activity Feed */}
        <div className="col-span-1 md:col-span-3 lg:col-span-1 row-span-2 flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-gray-900">Project Requests</h3>

          <form onSubmit={handleSubmitRequest} className="mb-6">
            <div className="relative">
              <textarea
                className="form-textarea w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100"
                rows={3}
                placeholder="Request a change or update..."
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
              />
              <button
                type="submit"
                className="absolute bottom-2 right-2 rounded-lg bg-gray-900 p-1.5 text-white hover:bg-gray-800"
              >
                <svg
                  className="h-4 w-4"
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
              </button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar max-h-[400px]">
            {requests.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">
                No active requests
              </p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-gray-100 last:before:hidden"
                >
                  <div
                    className={`absolute left-[-4px] top-2 h-2 w-2 rounded-full ${
                      req.status === "completed"
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="mb-1 text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-gray-700">{req.message}</p>
                  <span
                    className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      req.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
