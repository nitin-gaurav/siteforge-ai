import { supabase } from "./supabaseClient.js";

const DEFAULT_API_URL = (() => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }
  }

  return "/api";
})();

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  const trimmed = String(rawUrl).trim().replace(/\/+$/, "");

  try {
    const url = new URL(trimmed);
    if (url.hostname.endsWith(".onrenderer.com")) {
      url.hostname = url.hostname.replace(/\.onrenderer\.com$/i, ".onrender.com");
    }

    url.hash = "";
    url.search = "";

    const pathname = url.pathname.replace(/\/+$/, "");
    if (!pathname.endsWith("/api")) {
      url.pathname = `${pathname || ""}/api`;
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    const fixedHost = trimmed.replace(/\.onrenderer\.com\b/gi, ".onrender.com");
    const noTrailingSlash = fixedHost.replace(/\/+$/, "");
    return noTrailingSlash.endsWith("/api") ? noTrailingSlash : `${noTrailingSlash}/api`;
  }
}

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || DEFAULT_API_URL);
const REQUEST_TIMEOUT_MS = 120000;

async function authHeaders() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  const shouldRefresh = expiresAt && expiresAt - Date.now() < 60000;
  const activeSession = shouldRefresh
    ? (await supabase.auth.refreshSession()).data.session || session
    : session;

  return {
    "Content-Type": "application/json",
    ...(activeSession?.access_token ? { Authorization: `Bearer ${activeSession.access_token}` } : {})
  };
}

async function request(path, options = {}) {
  const makeRequest = async () => {
    const { timeoutMs, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || REQUEST_TIMEOUT_MS);

    try {
      return await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...(await authHeaders()),
          ...fetchOptions.headers
        }
      });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("The request took too long. Please try again with a shorter prompt.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  let response = await makeRequest();
  if (response.status === 401) {
    await supabase.auth.refreshSession();
    response = await makeRequest();
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    throw error;
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
  generateImages: (prompt, sections) => request("/generate/images", { method: "POST", body: JSON.stringify({ prompt, sections }) }),
  assistSite: (project, instruction) => request("/assistant", { method: "POST", body: JSON.stringify({ project, instruction }) })
};
