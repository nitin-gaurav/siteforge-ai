import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Sparkles,
  UserCircle
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { fetchProjectDetail, fetchProjects, readCachedProjects } from "../../services/projectCache.js";
import { supabase } from "../../services/supabaseClient.js";

const recentProjectStorageKey = "siteforge_recent_project_ids";
const recentProjectCacheKey = "siteforge_recent_project_cache";

function readRecentProjectIds() {
  try {
    return JSON.parse(localStorage.getItem(recentProjectStorageKey) || "[]").filter(Boolean);
  } catch {
    return [];
  }
}

function writeRecentProjectId(projectId) {
  const nextIds = [projectId, ...readRecentProjectIds().filter((id) => id !== projectId)].slice(0, 8);
  localStorage.setItem(recentProjectStorageKey, JSON.stringify(nextIds));
  return nextIds;
}

function readRecentProjectCache() {
  try {
    return JSON.parse(localStorage.getItem(recentProjectCacheKey) || "[]")
      .filter((project) => project?.id)
      .map((project) => ({
        id: project.id,
        name: project.name || "Untitled website",
        created_at: project.created_at,
        updated_at: project.updated_at
      }))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function writeRecentProjectCache(projects) {
  localStorage.setItem(
    recentProjectCacheKey,
    JSON.stringify(
      projects.slice(0, 3).map((project) => ({
        id: project.id,
        name: project.name || "Untitled website",
        created_at: project.created_at,
        updated_at: project.updated_at
      }))
    )
  );
}

function sidebarItemClass({ active, sidebarOpen }) {
  return `group flex h-11 w-full items-center gap-3 rounded-xl border px-3 text-sm font-black transition-all duration-200 ${
    active
      ? "border-[#d9d3f2] bg-[#f3f1fb] text-[#5b4bd1] shadow-sm"
      : "border-transparent text-slate-700 hover:border-[#e5e0f6] hover:bg-[#f7f5ff] hover:text-ink hover:shadow-sm active:scale-[0.98]"
  } ${sidebarOpen ? "justify-start" : "justify-center"}`;
}

function SidebarNavLink({ to, icon: Icon, label, active, sidebarOpen }) {
  return (
    <Link to={to} className={sidebarItemClass({ active, sidebarOpen })} title={label}>
      <Icon className={`h-4 w-4 shrink-0 transition ${active ? "text-[#5b4bd1]" : "text-slate-500 group-hover:text-[#5b4bd1]"}`} />
      <span className={sidebarOpen ? "truncate" : "hidden"}>{label}</span>
    </Link>
  );
}

function SidebarNavButton({ icon: Icon, label, active = false, sidebarOpen, onClick }) {
  return (
    <button type="button" onClick={onClick} className={sidebarItemClass({ active, sidebarOpen })} title={label}>
      <Icon className={`h-4 w-4 shrink-0 transition ${active ? "text-[#5b4bd1]" : "text-slate-500 group-hover:text-[#5b4bd1]"}`} />
      <span className={sidebarOpen ? "truncate" : "hidden"}>{label}</span>
    </button>
  );
}

function RecentProjectLink({ project, active }) {
  function prefetchProject() {
    fetchProjectDetail(project.id).catch(() => {
      // The editor page will show any real loading error if the user opens it.
    });
  }

  return (
    <Link
      to={`/editor/${project.id}`}
      onFocus={prefetchProject}
      onMouseEnter={prefetchProject}
      onPointerDown={prefetchProject}
      className={`group flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold transition-all duration-200 ${
        active
          ? "bg-[#f3f1fb] text-[#5b4bd1]"
          : "text-slate-600 hover:bg-[#f8f6ff] hover:text-ink"
      }`}
      title={project.name || "Untitled website"}
    >
      <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#5b4bd1]" : "text-slate-400 group-hover:text-[#5b4bd1]"}`} />
      <span className="truncate">{project.name || "Untitled website"}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(true);
  const [recentLoading, setRecentLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [recentProjects, setRecentProjects] = useState(() => readRecentProjectCache());
  const profileMenuRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);

  const isCreate = location.pathname === "/";
  const isDashboard = location.pathname === "/dashboard";
  const activeProjectId = location.pathname.match(/^\/editor\/([^/]+)/)?.[1];

  useEffect(() => {
    let cancelled = false;
    const recentIds = activeProjectId ? writeRecentProjectId(activeProjectId) : readRecentProjectIds();

    const cachedProjects = readCachedProjects();
    if (cachedProjects.length) {
      const projectsById = new Map(cachedProjects.map((project) => [project.id, project]));
      const openedProjects = recentIds.map((id) => projectsById.get(id)).filter(Boolean);
      const fallbackProjects = [...cachedProjects]
        .sort((first, second) => new Date(second.updated_at || second.created_at) - new Date(first.updated_at || first.created_at))
        .slice(0, 3);
      const nextRecentProjects = (openedProjects.length ? openedProjects : fallbackProjects).slice(0, 3);
      setRecentProjects(nextRecentProjects);
      writeRecentProjectCache(nextRecentProjects);
    }

    setRecentLoading(true);
    fetchProjects()
      .then((data) => {
        if (cancelled) return;
        const projects = data || [];
        const projectsById = new Map(projects.map((project) => [project.id, project]));
        const openedProjects = recentIds.map((id) => projectsById.get(id)).filter(Boolean);
        const fallbackProjects = [...projects]
          .sort((first, second) => new Date(second.updated_at || second.created_at) - new Date(first.updated_at || first.created_at))
          .slice(0, 3);
        const nextRecentProjects = (openedProjects.length ? openedProjects : fallbackProjects).slice(0, 3);
        setRecentProjects(nextRecentProjects);
        writeRecentProjectCache(nextRecentProjects);
      })
      .catch(() => {
        if (!cancelled && !recentProjects.length) setRecentProjects(readRecentProjectCache());
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    recentProjects.forEach((project) => {
      fetchProjectDetail(project.id).catch(() => {
        // Recent links can still navigate; the editor owns any visible error.
      });
    });
  }, [recentProjects]);

  useEffect(() => {
    function closeProfileMenu(event) {
      if (!profileMenuRef.current?.contains(event.target) && !mobileProfileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

  function signOut() {
    setSigningOut(true);
    setProfileOpen(false);
    localStorage.removeItem(recentProjectStorageKey);
    localStorage.removeItem(recentProjectCacheKey);
    window.setTimeout(() => navigate("/login", { replace: true }), 120);

    supabase.auth.signOut().catch((error) => {
      console.error("Sign out failed", error);
    });
  }

  return (
    <div className={`min-h-screen bg-[#f4f2fb] text-ink transition-opacity duration-150 ${signingOut ? "opacity-0" : "opacity-100"}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#d9d3f2] bg-white transition-[width] duration-300 ease-spring lg:flex ${
          sidebarOpen ? "w-[260px]" : "w-16"
        }`}
      >
        <div className={`flex min-h-0 flex-1 flex-col py-5 ${sidebarOpen ? "px-4" : "items-center px-2"}`}>
          <div className={`mb-5 flex items-center gap-3 ${sidebarOpen ? "w-full px-2" : "flex-col"}`}>
            <Link to="/" className={`flex min-w-0 flex-1 items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`} aria-label="SiteForge AI home">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5b4bd1] text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className={`min-w-0 ${sidebarOpen ? "block" : "hidden"}`}>
                <span className="block font-display text-lg font-black leading-tight tracking-tight">
                  SiteForge <span className="text-accent">AI</span>
                </span>
                <span className="block truncate text-xs font-bold text-muted">AI website builder</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9d3f2] bg-white text-slate-700 shadow-sm transition hover:bg-[#f3f1fb] hover:text-[#5b4bd1]"
              aria-label={sidebarOpen ? "Shrink sidebar" : "Expand sidebar"}
              title={sidebarOpen ? "Shrink sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex min-h-0 w-full flex-1 flex-col gap-1">
            <SidebarNavLink to="/" icon={Home} label="Home" active={isCreate} sidebarOpen={sidebarOpen} />
            <SidebarNavLink to="/dashboard" icon={LayoutDashboard} label="All Projects" active={isDashboard} sidebarOpen={sidebarOpen} />
            {sidebarOpen ? (
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setRecentOpen((open) => !open)}
                  className="flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-xs font-black uppercase tracking-[0.14em] text-muted transition hover:bg-[#f8f6ff] hover:text-[#5b4bd1]"
                  aria-expanded={recentOpen}
                >
                  Recent
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${recentOpen ? "rotate-0" : "-rotate-90"}`} />
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-spring ${recentOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="mt-1 grid gap-0.5">
                      {recentProjects.length ? (
                        recentProjects.map((project) => (
                          <RecentProjectLink key={project.id} project={project} active={project.id === activeProjectId} />
                        ))
                      ) : recentLoading ? (
                        <div className="grid gap-1 px-2.5 py-1">
                          {[1, 2, 3].map((item) => (
                            <span key={item} className="h-7 rounded-lg shimmer" />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg px-2.5 py-2 text-xs font-semibold text-muted">No recent projects yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-auto border-t border-[#eee9fb] pt-3" />
            <div ref={profileMenuRef} className="relative">
              <SidebarNavButton
                icon={UserCircle}
                label="Profile"
                active={profileOpen}
                sidebarOpen={sidebarOpen}
                onClick={() => setProfileOpen((open) => !open)}
              />
              {profileOpen ? (
                <div
                  className={`absolute left-0 bottom-full z-50 mb-2 rounded-xl border border-[#e5e0f6] bg-white p-3 shadow-lg ${
                    sidebarOpen ? "w-full" : "w-64"
                  }`}
                >
                  <p className="truncate px-1 pb-3 text-sm font-bold text-ink">{user?.email || "Signed in"}</p>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e0f6] bg-white text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-[#d9d3f2] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#5b4bd1] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="truncate font-display text-base font-black">SiteForge AI</span>
          </Link>
          <div ref={mobileProfileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e0f6] bg-white text-slate-700"
              aria-label="Open profile menu"
            >
              <UserCircle className="h-4 w-4" />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#e5e0f6] bg-white p-3 shadow-lg">
                <p className="truncate px-1 pb-3 text-sm font-bold text-ink">{user?.email || "Signed in"}</p>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e0f6] bg-white text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Link
            to="/"
            className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-black ${
              isCreate ? "border-[#d9d3f2] bg-[#f3f1fb] text-[#5b4bd1]" : "border-[#e5e0f6] bg-white text-slate-700"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-black ${
              isDashboard ? "border-[#d9d3f2] bg-[#f3f1fb] text-[#5b4bd1]" : "border-[#e5e0f6] bg-white text-slate-700"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            All Projects
          </Link>
        </nav>
      </header>

      <div className={`transition-[padding] duration-300 ease-spring ${sidebarOpen ? "lg:pl-[260px]" : "lg:pl-16"}`}>{children}</div>
    </div>
  );
}
