import React from "react";
import { Download, Home, LayoutDashboard, Maximize2, Minimize2, Palette, Save, ScrollText, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AiWebsiteAssistant from "../../components/editor/AiWebsiteAssistant.jsx";
import PromptPanel from "../../components/editor/PromptPanel.jsx";
import SectionList from "../../components/editor/SectionList.jsx";
import ThemePanel from "../../components/editor/ThemePanel.jsx";
import WebsitePreview from "../../components/preview/WebsitePreview.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import { api } from "../../services/api.js";
import { useEditorStore } from "../../store/editorStore.js";
import { downloadStaticSite } from "../../utils/exportStaticSite.js";

function mergeGeneratedSections(currentSections, generatedSections) {
  if (!Array.isArray(generatedSections) || generatedSections.length === 0) {
    return currentSections;
  }

  const nextSections = [...currentSections];

  generatedSections.forEach((section) => {
    const type = section?.type || "features";
    const lastCtaIndex = nextSections.map((nextSection) => nextSection.type).lastIndexOf("cta");
    const lastHeroIndex = nextSections.map((nextSection) => nextSection.type).lastIndexOf("hero");
    const lastSameTypeIndex = nextSections.map((nextSection) => nextSection.type).lastIndexOf(type);

    if (type === "hero") {
      const insertIndex = lastHeroIndex >= 0 ? lastHeroIndex + 1 : 0;
      nextSections.splice(insertIndex, 0, section);
      return;
    }

    if (type === "sidebar") {
      const insertIndex = lastHeroIndex >= 0 ? lastHeroIndex + 1 : 0;
      nextSections.splice(insertIndex, 0, section);
      return;
    }

    if (type === "cta") {
      nextSections.push(section);
      return;
    }

    if (type === "testimonial") {
      const insertIndex = lastCtaIndex >= 0 ? lastCtaIndex : nextSections.length;
      nextSections.splice(insertIndex, 0, section);
      return;
    }

    if (lastSameTypeIndex >= 0) {
      nextSections.splice(lastSameTypeIndex + 1, 0, section);
      return;
    }

    const insertIndex = lastCtaIndex >= 0 ? lastCtaIndex : nextSections.length;
    nextSections.splice(insertIndex, 0, section);
  });

  return nextSections;
}

function pickReplacementSection(targetSection, generatedSections) {
  if (!Array.isArray(generatedSections) || generatedSections.length === 0) return null;
  return generatedSections.find((section) => section.type === targetSection.type) || generatedSections[0];
}

export default function EditorPage() {
  const { projectId } = useParams();
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState("build");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const store = useEditorStore();
  const sidebarWidthClass = sidebarExpanded ? "w-[520px]" : "w-[300px]";
  const sidebarMinWidthClass = sidebarExpanded ? "min-w-[520px]" : "min-w-[300px]";

  useEffect(() => {
    let cancelled = false;

    setError("");

    if (!projectId) {
      store.resetProject();
      return;
    }

    store.startProjectLoad(projectId);

    api
      .getProject(projectId)
      .then(({ project }) => {
        if (!cancelled) {
          store.setProject(project);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          store.setStatus("idle");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function generateSite() {
    if (!store.prompt.trim()) return;
    const isExistingProject = store.sections?.length > 0;

    if (isExistingProject) {
      const confirmed = window.confirm("Apply AI changes to this project? New generated sections will be added to your current page.");
      if (!confirmed) return;
    }

    setError("");
    store.setStatus("generating");
    try {
      const data = await api.generateSite(store.prompt);
      if (isExistingProject) {
        store.setSections(mergeGeneratedSections(store.sections, data.sections));
      } else {
        store.setSections(data.sections);
        store.setTheme(data.theme);
        if (data.name) store.setName(data.name);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      store.setStatus("idle");
    }
  }

  async function regenerateSection(section) {
    const prompt = [
      store.prompt || `Regenerate a ${section.type} website section.`,
      `Regenerate only the ${section.type} section titled "${section.title || "Untitled section"}".`,
      "Keep it consistent with the current website style and audience."
    ].join(" ");

    setError("");
    setRegeneratingId(section.id);
    try {
      const data = await api.generateSite(prompt);
      const replacement = pickReplacementSection(section, data.sections);
      if (!replacement) return;

      store.setSections(
        store.sections.map((currentSection) =>
          currentSection.id === section.id ? { ...replacement, id: section.id, type: currentSection.type } : currentSection
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRegeneratingId(null);
    }
  }

  async function saveProject() {
    setError("");
    store.setStatus("saving");
    const payload = {
      name: store.name,
      prompt: store.prompt,
      sections: store.sections,
      theme: store.theme
    };

    try {
      if (store.projectId || projectId) {
        await api.updateProject(store.projectId || projectId, payload);
      } else {
        const data = await api.createProject(payload);
        store.setProject(data.project);
        window.history.replaceState(null, "", `/editor/${data.project.id}`);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      store.setStatus("idle");
    }
  }

  function exportStaticWebsite() {
    downloadStaticSite({
      name: store.name,
      sections: store.sections,
      theme: store.theme
    });
  }

  function applyAssistantUpdates(updates = {}) {
    if (updates.theme && Object.keys(updates.theme).length) {
      store.setTheme(updates.theme);
    }

    if (Array.isArray(updates.sections) && updates.sections.length) {
      const sectionPatches = new Map(updates.sections.map((section) => [section.id, section]));

      store.setSections(
        store.sections.map((section) => {
          const patch = sectionPatches.get(section.id);
          if (!patch) return section;

          return {
            ...section,
            ...patch,
            id: section.id,
            type: section.type,
            image: patch.image ? { ...(section.image || {}), ...patch.image } : section.image,
            items: Array.isArray(patch.items) ? patch.items : section.items
          };
        })
      );
    }
  }

  return (
    <main className="flex h-screen overflow-hidden bg-panel text-ink">
      <aside
        className={`relative flex h-full shrink-0 flex-col border-r border-[#e5e0f6] bg-white transition-[width] duration-300 ease-spring ${
          sidebarWidthClass
        }`}
      >
        <div className={`flex h-full ${sidebarMinWidthClass} flex-col overflow-hidden`}>
        <div className="border-b border-[#eee9fb] px-4 py-4">
          <div className="mb-4 flex items-center gap-3">
            <Link to="/" className="flex min-w-0 flex-1 items-center gap-3" aria-label="SiteForge AI home">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5b4bd1] text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-black leading-tight">
                  SiteForge <span className="text-accent">AI</span>
                </span>
                <span className="block truncate text-[11px] font-bold text-muted">Editor workspace</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarExpanded((expanded) => !expanded)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e0f6] bg-white text-slate-700 transition hover:bg-[#f4f6fb] hover:text-accent"
              aria-label={sidebarExpanded ? "Shrink editor panel" : "Expand editor panel"}
              title={sidebarExpanded ? "Shrink editor panel" : "Expand editor panel"}
            >
              {sidebarExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e0f6] bg-white text-xs font-black text-slate-700 transition hover:bg-[#f4f6fb]"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <Link
              to="/dashboard"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e0f6] bg-white text-xs font-black text-slate-700 transition hover:bg-[#f4f6fb]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="border-b border-[#eee9fb] bg-white p-4">
          <div className={`grid gap-3 ${sidebarExpanded ? "grid-cols-[minmax(0,1fr)_140px] items-end" : ""}`}>
            <Input label="Project name" value={store.name} onChange={(event) => store.setName(event.target.value)} />
            <Button className="w-full rounded-xl shadow-sm" loading={store.status === "saving"} onClick={saveProject}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
          {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>

        <div className="border-b border-[#eee9fb] bg-white px-3 py-3">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f4f1ff] p-1">
            {[
              ["build", Wand2, "Build"],
              ["theme", Palette, "Theme"],
              ["sections", ScrollText, "Sections"]
            ].map(([key, Icon, label]) => (
              <button
                key={key}
                className={`flex h-9 items-center justify-center gap-1 rounded-lg text-xs font-bold transition ${
                  activePanel === key ? "bg-white text-accent shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-ink"
                }`}
                onClick={() => setActivePanel(key)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={`min-h-0 overflow-y-auto bg-[#fbfaff] ${activePanel === "build" ? "" : "flex-1"}`}>
          {activePanel === "build" ? (
            <PromptPanel
              prompt={store.prompt}
              onPromptChange={store.setPrompt}
            />
          ) : null}
          {activePanel === "theme" ? <ThemePanel theme={store.theme} onThemeChange={store.setTheme} /> : null}
          {activePanel === "sections" ? (
            <SectionList
              sections={store.sections}
              onAdd={store.addSection}
              onRemove={store.removeSection}
              onUpdate={store.updateSection}
              onReorder={store.reorderSections}
              onRegenerate={regenerateSection}
              regeneratingId={regeneratingId}
              expanded={sidebarExpanded}
            />
          ) : null}
        </div>

        {activePanel === "build" ? (
          <div className="bg-[#fbfaff] px-4 pb-4 pt-2">
            <Button
              onClick={generateSite}
              loading={store.status === "generating"}
              disabled={!store.prompt.trim()}
              className="mb-3 w-full rounded-xl shadow-sm"
            >
              <Wand2 className="h-4 w-4" />
              Apply Changes
            </Button>
            <button
              type="button"
              onClick={exportStaticWebsite}
              disabled={!store.sections.length}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e0f6] bg-white text-sm font-black text-slate-700 transition hover:bg-[#f4f6fb] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export HTML
            </button>
          </div>
        ) : null}
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-3">
        <WebsitePreview sections={store.sections} theme={store.theme} loading={store.status === "loading"} />
      </section>
      <AiWebsiteAssistant
        project={{
          name: store.name,
          prompt: store.prompt,
          sections: store.sections,
          theme: store.theme
        }}
        onApplyUpdates={applyAssistantUpdates}
      />
    </main>
  );
}
