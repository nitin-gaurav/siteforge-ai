import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, FolderOpen, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../../components/ui/AppShell.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import { api } from "../../services/api.js";
import { fetchProjectDetail, fetchProjects, getProjectListSnapshot, removeCachedProject, subscribeProjectList, writeCachedProject, writeCachedProjects } from "../../services/projectCache.js";
import { supabase } from "../../services/supabaseClient.js";

function formatTimeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function inferIndustryTag(project) {
  const text = `${project.name || ""} ${project.prompt || ""} ${project.sections?.map((section) => `${section.type || ""} ${section.title || ""}`).join(" ") || ""}`.toLowerCase();
  const rules = [
    ["Healthcare", ["clinic", "dental", "doctor", "medical", "health"]],
    ["Cafe", ["coffee", "cafe", "bakery", "artisan"]],
    ["Wellness", ["yoga", "fitness", "women", "studio"]],
    ["Automotive", ["motorcycle", "bike", "ride", "rider"]],
    ["Entertainment", ["anime", "manga", "rank", "arena"]],
    ["Commerce", ["shop", "store", "product", "ecommerce"]],
    ["SaaS", ["saas", "software", "platform", "app"]],
    ["Creative", ["agency", "portfolio", "design", "creator"]]
  ];

  return rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] || "Website";
}

function ProjectCard({ project, onDelete, onRequestRename, onMissing, deleting }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const updatedAt = new Date(project.updated_at || project.created_at);
  const previewImage = project.preview_image_url || project.sections?.find((section) => section.image?.url)?.image?.url;
  const sectionCount = project.section_count ?? project.sections?.length ?? 0;
  const industryTag = inferIndustryTag(project);
  const theme = {
    primary: project.theme?.primary || "#2f6fed",
    background: project.theme?.background || "#ffffff"
  };

  function toggleMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen((open) => !open);
  }

  function renameProject(event) {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    onRequestRename(project);
  }

  function deleteProject(event) {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    onDelete(project.id);
  }

  function prefetchProject() {
    fetchProjectDetail(project.id).catch((error) => {
      if (error.status === 404) onMissing(project.id);
    });
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_46px_rgba(58,48,112,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={prefetchProject}
      onFocus={prefetchProject}
    >
      <div className="absolute right-4 top-4 z-20">
        <button
          type="button"
          onClick={toggleMenu}
          disabled={deleting}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/25 backdrop-blur-sm ring-1 ring-white/35 transition hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657dc]/35 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Project options for ${project.name || "project"}`}
          title="Project options"
        >
          <MoreVertical className="h-3 w-3 text-white drop-shadow-sm" />
        </button>
        {menuOpen ? (
          <>
            <button className="fixed inset-0 z-10 cursor-default" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
            <div className="absolute right-0 top-11 z-20 w-36 rounded-xl border border-[#e5e0f6] bg-white p-1.5 shadow-[0_18px_44px_rgba(58,48,112,0.16)]">
              <button
                type="button"
                onClick={renameProject}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-[#f3f1fb] hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                type="button"
                onClick={deleteProject}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        ) : null}
      </div>

      <Link
        to={`/editor/${project.id}`}
        className="flex min-h-[300px] flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6657dc]/35"
      >
      <div className="relative m-3 h-40 overflow-hidden rounded-xl" style={{ background: theme.background }}>
        {previewImage ? (
          <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={previewImage} alt="" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#eef1f8] via-white to-[#d9d3f2]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
            {sectionCount ? `${sectionCount} ${sectionCount === 1 ? "section" : "sections"}` : "Saved project"}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-6 pb-6 pt-3">
        <h2 className="clamp-2 text-lg font-semibold leading-snug text-gray-900">
          {project.name || "Untitled website"}
        </h2>
        <div className="mt-2.5">
          <span className="rounded-full border border-[#d9d3f2] bg-[#f3f1fb] px-3 py-1 text-xs font-bold text-[#5b4bd1]">
            {industryTag}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Updated {formatTimeAgo(updatedAt)}</span>
        </div>
      </div>
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/80 bg-white px-8 py-16 text-center shadow-[0_24px_70px_rgba(77,63,148,0.10)]">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[#f0eefb] text-accent">
        <FolderOpen className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-ink">No saved projects yet</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
        Start from the prompt screen and generated websites will appear here.
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="min-h-[300px] overflow-hidden rounded-2xl border border-white bg-white p-3 shadow-[0_18px_46px_rgba(58,48,112,0.10)]">
      <div className="h-40 rounded-xl shimmer" />
      <div className="p-5">
        <div className="mb-3 h-5 w-3/4 rounded-md shimmer" />
        <div className="mb-2 h-3 w-full rounded-md shimmer" />
        <div className="h-3 w-2/3 rounded-md shimmer" />
      </div>
    </div>
  );
}

function projectTimestamp(project) {
  const timestamp = Date.parse(project?.updated_at || project?.created_at || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortProjectsByRecent(projects = []) {
  return [...projects].sort((first, second) => projectTimestamp(second) - projectTimestamp(first));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => sortProjectsByRecent(getProjectListSnapshot()));
  const [loading, setLoading] = useState(() => getProjectListSnapshot().length === 0);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const renameDisabled = useMemo(() => !renameValue.trim() || !renameTarget, [renameTarget, renameValue]);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeProjectList((nextProjects) => {
      if (!cancelled) {
        setProjects(sortProjectsByRecent(nextProjects));
        setLoading(false);
      }
    });
    const cachedProjects = getProjectListSnapshot();

    if (cachedProjects.length) {
      setProjects(sortProjectsByRecent(cachedProjects));
      setLoading(false);
    }

    fetchProjects({ force: true })
      .then((data) => {
        if (!cancelled) setProjects(sortProjectsByRecent(data || []));
      })
      .catch(async (requestError) => {
        if (cancelled) return;
        if (requestError.status === 401) {
          await supabase.auth.signOut();
          navigate("/login", { replace: true });
          return;
        }
        setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigate]);

  async function deleteProject(id) {
    const previousProjects = projects;
    setError("");
    setDeletingId(id);
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== id));

    try {
      await api.deleteProject(id);
      removeCachedProject(id);
    } catch (requestError) {
      setProjects(previousProjects);
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function renameProject(project, name) {
    const previousProjects = projects;
    setError("");
    setProjects((currentProjects) => currentProjects.map((item) => (item.id === project.id ? { ...item, name } : item)));

    try {
      const data = await api.updateProject(project.id, {
        name
      });
      setProjects((currentProjects) => sortProjectsByRecent(currentProjects.map((item) => (item.id === project.id ? data.project : item))));
      writeCachedProjects(sortProjectsByRecent(projects.map((item) => (item.id === project.id ? data.project : item))));
      writeCachedProject(data.project);
    } catch (requestError) {
      setProjects(previousProjects);
      setError(requestError.message);
    }
  }

  function openRename(project) {
    setError("");
    setRenameTarget(project);
    setRenameValue(project?.name || "Untitled website");
    setRenameOpen(true);
  }

  function closeRename() {
    setRenameOpen(false);
    setRenameTarget(null);
    setRenameValue("");
  }

  async function submitRename(event) {
    event?.preventDefault?.();
    if (renameDisabled) return;
    const project = renameTarget;
    const nextName = renameValue.trim();
    closeRename();
    await renameProject(project, nextName);
  }

  return (
    <AppShell>
      {renameOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/40"
            onClick={closeRename}
            aria-label="Close rename dialog"
          />
          <form
            onSubmit={submitRename}
            className="relative w-full max-w-md rounded-2xl border border-white/70 bg-white p-5 shadow-[0_24px_70px_rgba(58,48,112,0.22)]"
          >
            <h2 className="font-display text-xl font-black text-ink">Rename project</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Enter a new name for this project.</p>

            <div className="mt-4">
              <Input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="h-11 rounded-xl"
                aria-label="Project name"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" className="rounded-xl" onClick={closeRename}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={renameDisabled}>
                Rename
              </Button>
            </div>
          </form>
        </div>
      ) : null}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/70 pb-6">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#5b4bd1]">Workspace</p>
            <h1 className="font-display text-4xl font-black text-ink sm:text-5xl">Projects</h1>
            <p className="mt-2 text-sm font-semibold text-muted">
              {loading ? "Loading your saved projects..." : `Manage ${projects.length} saved website project${projects.length !== 1 ? "s" : ""} from one place.`}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-base font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            New Website
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={deleteProject}
                onRequestRename={openRename}
                onMissing={(id) => {
                  removeCachedProject(id);
                  setProjects((currentProjects) => currentProjects.filter((item) => item.id !== id));
                }}
                deleting={deletingId === project.id}
              />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
