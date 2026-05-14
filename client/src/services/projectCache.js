import { api } from "./api.js";

const projectCacheKey = "siteforge_project_list_cache";
const projectDetailCachePrefix = "siteforge_project_detail:";
let pendingProjectsRequest = null;
const pendingProjectDetailRequests = new Map();
const projectDetailMemoryCache = new Map();
const maxPersistentProjectDetailChars = 900000;

function projectTimestamp(project) {
  const value = project?.updated_at || project?.created_at || "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortProjectsByRecent(projects = []) {
  return [...projects].sort((first, second) => projectTimestamp(second) - projectTimestamp(first));
}

function summarizeProject(project) {
  const sections = Array.isArray(project.sections) ? project.sections : [];

  return {
    id: project.id,
    user_id: project.user_id,
    name: project.name || "Untitled website",
    prompt: project.prompt || "",
    theme: project.theme || {},
    created_at: project.created_at,
    updated_at: project.updated_at,
    section_count: project.section_count ?? sections.length,
    preview_image_url: project.preview_image_url || project.sections?.find((section) => section.image?.url)?.image?.url || "",
    preview_image_alt: project.preview_image_alt || project.sections?.find((section) => section.image?.alt)?.image?.alt || "",
    sections: sections.map((section) => ({
      type: section.type || "",
      title: section.title || ""
    }))
  };
}

export function readCachedProjects() {
  try {
    const cached = JSON.parse(localStorage.getItem(projectCacheKey) || "[]");
    return Array.isArray(cached) ? sortProjectsByRecent(cached.filter((project) => project?.id)) : [];
  } catch {
    return [];
  }
}

export function writeCachedProjects(projects) {
  try {
    localStorage.setItem(projectCacheKey, JSON.stringify(sortProjectsByRecent((projects || []).map(summarizeProject))));
  } catch {
    // Ignore storage quota errors. The network result is still returned.
  }
}

export function updateCachedProjects(updater) {
  const nextProjects = updater(readCachedProjects());
  writeCachedProjects(nextProjects);
  return nextProjects;
}

function projectDetailCacheKey(id) {
  return `${projectDetailCachePrefix}${id}`;
}

function normalizeProjectDetail(project) {
  if (!project?.id || !Array.isArray(project.sections)) return null;

  return {
    id: project.id,
    user_id: project.user_id,
    name: project.name || "Untitled website",
    prompt: project.prompt || "",
    sections: project.sections,
    theme: project.theme || {},
    created_at: project.created_at,
    updated_at: project.updated_at
  };
}

function hasInlineRasterImage(value) {
  if (!value || typeof value !== "object") return false;
  if (typeof value.url === "string" && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value.url)) return true;
  if (Array.isArray(value)) return value.some(hasInlineRasterImage);
  return Object.values(value).some(hasInlineRasterImage);
}

export function readCachedProject(id) {
  if (!id) return null;
  if (projectDetailMemoryCache.has(id)) return projectDetailMemoryCache.get(id);

  try {
    const cached = JSON.parse(localStorage.getItem(projectDetailCacheKey(id)) || "null");
    return normalizeProjectDetail(cached);
  } catch {
    return null;
  }
}

export function writeCachedProject(project) {
  const normalizedProject = normalizeProjectDetail(project);
  if (!normalizedProject) return;

  projectDetailMemoryCache.set(normalizedProject.id, normalizedProject);

  try {
    if (hasInlineRasterImage(normalizedProject)) {
      updateCachedProjects((projects) => {
        const existingIndex = projects.findIndex((item) => item.id === normalizedProject.id);
        if (existingIndex < 0) return sortProjectsByRecent([normalizedProject, ...projects]);

        return sortProjectsByRecent(projects.map((item) => (item.id === normalizedProject.id ? { ...item, ...normalizedProject } : item)));
      });
      return;
    }

    const serializedProject = JSON.stringify(normalizedProject);
    if (serializedProject.length > maxPersistentProjectDetailChars) return;

    localStorage.setItem(projectDetailCacheKey(normalizedProject.id), serializedProject);
    updateCachedProjects((projects) => {
      const existingIndex = projects.findIndex((item) => item.id === normalizedProject.id);
      if (existingIndex < 0) return sortProjectsByRecent([normalizedProject, ...projects]);

      return sortProjectsByRecent(projects.map((item) => (item.id === normalizedProject.id ? { ...item, ...normalizedProject } : item)));
    });
  } catch {
    // Ignore storage quota errors. The network result is still returned.
  }
}

export function removeCachedProject(id) {
  if (!id) return;

  try {
    projectDetailMemoryCache.delete(id);
    localStorage.removeItem(projectDetailCacheKey(id));
    updateCachedProjects((projects) => projects.filter((project) => project.id !== id));
  } catch {
    // Ignore storage errors. The server remains the source of truth.
  }
}

export async function fetchProjectDetail(id, { force = false } = {}) {
  if (!id) return null;
  if (!force) {
    const cachedProject = readCachedProject(id);
    if (cachedProject) return cachedProject;
  }

  if (pendingProjectDetailRequests.has(id)) {
    return pendingProjectDetailRequests.get(id);
  }

  const request = api
    .getProject(id)
    .then(({ project }) => {
      writeCachedProject(project);
      return project;
    })
    .finally(() => {
      pendingProjectDetailRequests.delete(id);
    });

  pendingProjectDetailRequests.set(id, request);
  return request;
}

export async function fetchProjects({ force = false } = {}) {
  if (pendingProjectsRequest) return pendingProjectsRequest;

  pendingProjectsRequest = api
    .listProjects()
    .then((data) => {
      const projects = sortProjectsByRecent(data.projects || []);
      writeCachedProjects(projects);
      return projects;
    })
    .finally(() => {
      pendingProjectsRequest = null;
    });

  return pendingProjectsRequest;
}
