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
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) throw error;

  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  const shouldRefresh = expiresAt && expiresAt - Date.now() < 60000;
  const refreshed = shouldRefresh ? await supabase.auth.refreshSession() : null;
  const activeSession = refreshed?.data.session || session;

  if (refreshed?.error) throw refreshed.error;
  if (!activeSession?.access_token) {
    const authError = new Error("Please log in again to continue.");
    authError.status = 401;
    throw authError;
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${activeSession.access_token}`
  };
}

async function handleUnauthorized() {
  await supabase.auth.signOut().catch(() => {});
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
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

  let response;
  try {
    response = await makeRequest();
  } catch (error) {
    if (error.status === 401) {
      await handleUnauthorized();
    }
    throw error;
  }
  if (response.status === 401) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session?.access_token) {
      await handleUnauthorized();
    }
    response = await makeRequest();
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    if (response.status === 401) {
      await handleUnauthorized();
    }
    throw error;
  }
  return payload;
}

function projectListPath(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (Array.isArray(options.ids) && options.ids.length) params.set("ids", options.ids.filter(Boolean).join(","));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

export const api = {
  listProjects: (options) => request(projectListPath(options)),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (project) => request("/projects", { method: "POST", body: JSON.stringify(project) }),
  updateProject: (id, project) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  generateSite: (prompt) => request("/generate", { method: "POST", body: JSON.stringify({ prompt }) }),
  generateImages: (prompt, sections, options) => request("/generate/images", { method: "POST", body: JSON.stringify({ prompt, sections, options }) }),
  assistSite: (project, instruction) => request("/assistant", { method: "POST", body: JSON.stringify({ project, instruction }) })
};
