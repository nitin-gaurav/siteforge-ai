import { supabase } from "./supabaseClient.js";

const DEFAULT_API_URL = (() => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }
  }

  return "https://siteforge-ai-o8ca.onrender.com/api";
})();

const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

async function authHeaders() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(await authHeaders()),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

export const api = {
  listProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (project) => request("/projects", { method: "POST", body: JSON.stringify(project) }),
  updateProject: (id, project) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  generateSite: (prompt) => request("/generate", { method: "POST", body: JSON.stringify({ prompt }) }),
  assistSite: (project, instruction) => request("/assistant", { method: "POST", body: JSON.stringify({ project, instruction }) })
};
