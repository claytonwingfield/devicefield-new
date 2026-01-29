"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import LoadingAnimation from "@/components/loading-animation";

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    description: "",
    url: "",
    database_url: "",
    status: "active",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      fetchData();
    };

    checkAdmin();
  }, [router, supabase]);

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: projectsData } = await supabase
      .from("projects")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (usersData) setProfiles(usersData);
    if (projectsData) setProjects(projectsData);
    setLoading(false);
  };

  // Helper to ensure we store the human-readable Dashboard URL
  const formatDatabaseUrl = (url: string) => {
    // If it looks like an API URL (e.g., https://xyz.supabase.co), convert it
    if (url && url.includes(".supabase.co")) {
      const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
      if (match && match[1]) {
        return `https://supabase.com/dashboard/project/${match[1]}`;
      }
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-fix the database URL before saving
    const cleanData = {
      ...formData,
      database_url: formatDatabaseUrl(formData.database_url),
    };

    if (editingId) {
      // Update existing project
      const { error } = await supabase
        .from("projects")
        .update(cleanData)
        .eq("id", editingId);

      if (error) {
        alert("Error updating project: " + error.message);
      } else {
        alert("Project updated successfully!");
        resetForm();
        fetchData();
      }
    } else {
      // Create new project
      const { error } = await supabase.from("projects").insert([cleanData]);

      if (error) {
        alert("Error creating project: " + error.message);
      } else {
        alert("Project created successfully!");
        resetForm();
        fetchData();
      }
    }
  };

  const handleEditClick = (project: any) => {
    setEditingId(project.id);
    setFormData({
      user_id: project.user_id,
      name: project.name,
      description: project.description || "",
      url: project.url || "",
      database_url: project.database_url || "",
      status: project.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      user_id: "",
      name: "",
      description: "",
      url: "",
      database_url: "",
      status: "active",
    });
  };

  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center pt-32">
        <LoadingAnimation className="h-24 w-24" />
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 sm:px-6 mb-20">
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create/Edit Project Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Project" : "Add New Project"}
            </h2>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Assign to User
              </label>
              <select
                className="form-select w-full rounded-lg border-gray-200"
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: e.target.value })
                }
                required
              >
                <option value="">Select a user...</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name} ({profile.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Project Name
              </label>
              <input
                type="text"
                className="form-input w-full rounded-lg border-gray-200"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                className="form-select w-full rounded-lg border-gray-200"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                className="form-textarea w-full rounded-lg border-gray-200"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Website URL Input */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Website URL (Public Site)
              </label>
              <input
                type="url"
                className="form-input w-full rounded-lg border-gray-200"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://client-website.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                This links to 'Visit Site'
              </p>
            </div>

            {/* Database URL Input */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Supabase / Database URL
              </label>
              <input
                type="url"
                className="form-input w-full rounded-lg border-gray-200"
                value={formData.database_url}
                onChange={(e) =>
                  setFormData({ ...formData, database_url: e.target.value })
                }
                placeholder="https://supabase.com/dashboard/project/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste your Supabase URL here. We'll automatically format it to
                the dashboard link.
              </p>
            </div>

            <button
              type="submit"
              className={`btn w-full text-white ${editingId ? "bg-green-600 hover:bg-green-700" : "bg-blue-primary hover:bg-blue-primary/90"}`}
            >
              {editingId ? "Update Project" : "Create Project"}
            </button>
          </form>
        </div>

        {/* Existing Projects List */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">All Projects</h2>
          <div className="space-y-4 overflow-y-auto max-h-[800px] pr-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`rounded-lg border p-4 transition-colors ${editingId === project.id ? "border-blue-primary bg-blue-primary/90" : "border-gray-100 bg-gray-50"}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="overflow-hidden mr-3">
                    <h3 className="font-semibold truncate text-lg">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {project.profiles?.full_name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full shrink-0 uppercase tracking-wide font-bold ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : project.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-4 bg-white/50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center">🌐</span>
                    {project.url ? (
                      <a
                        href={project.url}
                        target="_blank"
                        className="text-blue-primary hover:underline truncate"
                      >
                        {project.url}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">
                        No Website Link
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center">🗄️</span>
                    {project.database_url ? (
                      <a
                        href={project.database_url}
                        target="_blank"
                        className="text-green-600 hover:underline truncate"
                      >
                        {project.database_url}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No DB Link</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No projects found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
