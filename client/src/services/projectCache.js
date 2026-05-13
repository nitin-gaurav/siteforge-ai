import { api } from "./api.js";

const projectCacheKey = "siteforge_project_list_cache";
let pendingProjectsRequest = null;

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
    return Array.isArray(cached) ? cached.filter((project) => project?.id) : [];
  } catch {
    return [];
  }
}

export function writeCachedProjects(projects) {
  try {
    localStorage.setItem(projectCacheKey, JSON.stringify((projects || []).map(summarizeProject)));
  } catch {
    // Ignore storage quota errors. The network result is still returned.
  }
}

export function updateCachedProjects(updater) {
  const nextProjects = updater(readCachedProjects());
  writeCachedProjects(nextProjects);
  return nextProjects;
}

export async function fetchProjects({ force = false } = {}) {
  if (pendingProjectsRequest) return pendingProjectsRequest;

  pendingProjectsRequest = api
    .listProjects()
    .then((data) => {
      const projects = data.projects || [];
      writeCachedProjects(projects);
      return projects;
    })
    .finally(() => {
      pendingProjectsRequest = null;
    });

  return pendingProjectsRequest;
}
