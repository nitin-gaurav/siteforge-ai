import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/ui/AppShell.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import { api } from "../../services/api.js";
import { writeCachedProject } from "../../services/projectCache.js";
import { optimizeProjectImages } from "../../utils/imageOptimizer.js";

const examples = [
  "A dental clinic in Mumbai",
  "A coffee shop with artisan blends",
  "A yoga studio for women"
];

const imageExamples = [
  "Logo for a dental clinic",
  "Logo set for an artisan coffee shop",
  "App logo for a women's yoga studio"
];

const headlinePrefix = "Describe your business";

const websiteHeadlineSuffixes = [
  "we'll build your website",
  "we'll generate your site",
  "we'll build it in seconds"
];

const imageHeadlineSuffixes = [
  "we'll generate logos",
  "we'll create brand marks",
  "we'll make app icons"
];

const initialBusinessBrief = {
  businessName: "",
  industry: "",
  targetAudience: "",
  toneStyle: ""
};

const toneOptions = [
  "Modern",
  "Premium",
  "Friendly",
  "Professional"
];

const websiteLoadingSteps = [
  "Drafting the page structure...",
  "Writing sections and calls to action...",
  "Matching visual direction...",
  "Saving your website project..."
];

const imageLoadingSteps = [
  "Reading your brand brief...",
  "Sketching logo directions...",
  "Rendering AI logo concepts...",
  "Preparing your editable preview..."
];

const homeDraftStorageKey = "siteforge_home_draft";

function projectNameFromPrompt(prompt) {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Untitled website";
  return cleaned.length > 54 ? `${cleaned.slice(0, 51)}...` : cleaned;
}

function buildImageModeSections(prompt) {
  const cleanPrompt = prompt.trim();
  const baseQuery = cleanPrompt || "brand logo";

  return [
    {
      type: "graphics",
      title: "AI Image Generation",
      eyebrow: "Logo concepts",
      body: "Generated logo concepts and brand marks based on the image brief.",
      image: {
        query: `${baseQuery} square logo mark clean brand identity no mockup no banner`,
        alt: "Generated logo concept"
      },
      items: [
        {
          title: "Primary Logo Concept",
          meta: "Logo",
          body: "A clean primary logo mark for the brand.",
          image: {
            query: `${baseQuery} square primary logo mark clean brand identity centered no mockup no long text`,
            alt: "Primary logo concept"
          }
        },
        {
          title: "App Icon Concept",
          meta: "App Icon",
          body: "A compact app icon style symbol for small-format use.",
          image: {
            query: `${baseQuery} square app icon logo symbol simple centered high contrast no long text`,
            alt: "App icon concept"
          }
        },
        {
          title: "Brand Mark Concept",
          meta: "Brand Mark",
          body: "A flexible visual mark for brand assets and social profiles.",
          image: {
            query: `${baseQuery} minimal brand mark logo symbol vector style centered no mockup`,
            alt: "Brand mark concept"
          }
        }
      ]
    }
  ];
}

function hasBusinessBrief(brief) {
  return [
    brief.businessName,
    brief.industry,
    brief.targetAudience,
    brief.toneStyle
  ].some((value) => value.trim());
}

function compileBusinessPrompt(brief, extraPrompt = "") {
  if (!hasBusinessBrief(brief) && !extraPrompt.trim()) return "";

  return [
    "Generate a small business website from this business brief:",
    brief.businessName ? `Business name: ${brief.businessName}` : "",
    brief.industry ? `Category/industry: ${brief.industry}` : "",
    brief.targetAudience ? `Target audience: ${brief.targetAudience}` : "",
    brief.toneStyle ? `Preferred tone/style: ${brief.toneStyle}` : "",
    "Generate: website content, landing page sections, FAQs, testimonials, contact information blocks, SEO content, and AI-generated images",
    extraPrompt.trim() ? `Additional instructions: ${extraPrompt.trim()}` : ""
  ].filter(Boolean).join("\n");
}

function readHomeDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(homeDraftStorageKey) || "{}");
    return {
      prompt: typeof draft.prompt === "string" ? draft.prompt : "",
      mode: draft.mode === "images" ? "images" : "website",
      businessBrief: {
        ...initialBusinessBrief,
        ...(draft.businessBrief && typeof draft.businessBrief === "object" ? draft.businessBrief : {})
      }
    };
  } catch {
    return {
      prompt: "",
      mode: "website",
      businessBrief: initialBusinessBrief
    };
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const initialDraft = useMemo(() => readHomeDraft(), []);
  const [prompt, setPrompt] = useState(initialDraft.prompt);
  const [businessBrief, setBusinessBrief] = useState(initialDraft.businessBrief);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState(initialDraft.mode);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedHeadlineSuffix, setTypedHeadlineSuffix] = useState("");
  const [isDeletingHeadline, setIsDeletingHeadline] = useState(false);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const [loadingStartedAt, setLoadingStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const headlineTimeoutRef = useRef(null);
  const toneMenuRef = useRef(null);

  const isImageMode = mode === "images";
  const activeExamples = isImageMode ? imageExamples : examples;
  const effectivePrompt = isImageMode ? prompt.trim() : compileBusinessPrompt(businessBrief, prompt).trim();
  const headlineSuffixOptions = useMemo(
    () => (isImageMode ? imageHeadlineSuffixes : websiteHeadlineSuffixes),
    [isImageMode]
  );
  const headlineSuffix = headlineSuffixOptions[headlineIndex % headlineSuffixOptions.length];
  const displayHeadline = `${headlinePrefix} - ${headlineSuffix}`;
  const loadingSteps = isImageMode ? imageLoadingSteps : websiteLoadingSteps;
  const loadingStepIndex = Math.min(Math.floor(elapsedSeconds / 8), loadingSteps.length - 1);
  const canGenerate = Boolean(effectivePrompt);

  useEffect(() => {
    localStorage.setItem(homeDraftStorageKey, JSON.stringify({ prompt, businessBrief, mode }));
  }, [prompt, businessBrief, mode]);

  useEffect(() => {
    setHeadlineIndex(0);
    setTypedHeadlineSuffix("");
    setIsDeletingHeadline(false);
  }, [isImageMode]);

  useEffect(() => {
    function closeToneMenu(event) {
      if (!toneMenuRef.current?.contains(event.target)) {
        setToneMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeToneMenu);
    return () => document.removeEventListener("mousedown", closeToneMenu);
  }, []);

  useEffect(() => {
    if (headlineTimeoutRef.current) clearTimeout(headlineTimeoutRef.current);

    if (!isDeletingHeadline && typedHeadlineSuffix === headlineSuffix) {
      headlineTimeoutRef.current = setTimeout(() => setIsDeletingHeadline(true), 1250);
      return () => clearTimeout(headlineTimeoutRef.current);
    }

    if (isDeletingHeadline && typedHeadlineSuffix === "") {
      headlineTimeoutRef.current = setTimeout(() => {
        setHeadlineIndex((current) => (current + 1) % headlineSuffixOptions.length);
        setIsDeletingHeadline(false);
      }, 220);
      return () => clearTimeout(headlineTimeoutRef.current);
    }

    headlineTimeoutRef.current = setTimeout(() => {
      if (isDeletingHeadline) {
        setTypedHeadlineSuffix((text) => text.slice(0, -1));
      } else {
        setTypedHeadlineSuffix(headlineSuffix.slice(0, typedHeadlineSuffix.length + 1));
      }
    }, isDeletingHeadline ? 34 : 58);

    return () => clearTimeout(headlineTimeoutRef.current);
  }, [headlineSuffix, headlineSuffixOptions.length, isDeletingHeadline, typedHeadlineSuffix]);

  useEffect(() => {
    if (!generating || !loadingStartedAt) return undefined;

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - loadingStartedAt) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [generating, loadingStartedAt]);

  async function generateWebsite(event) {
    event?.preventDefault();

    const trimmedPrompt = effectivePrompt;
    if (!trimmedPrompt || generating) return;

    setError("");
    setGenerating(true);
    setLoadingStartedAt(Date.now());
    setElapsedSeconds(0);

    try {
      const generated = isImageMode ? null : await api.generateSite(trimmedPrompt);
      const projectSections = isImageMode
        ? (await api.generateImages(trimmedPrompt, buildImageModeSections(trimmedPrompt))).sections
        : generated.sections;
      const optimizedSections = await optimizeProjectImages(Array.isArray(projectSections) ? projectSections : []);
      const data = await api.createProject({
        name: isImageMode
          ? `AI Graphics - ${projectNameFromPrompt(trimmedPrompt)}`
          : generated.name || projectNameFromPrompt(trimmedPrompt),
        prompt: trimmedPrompt,
        sections: optimizedSections,
        theme: generated?.theme || {}
      });

      localStorage.removeItem(homeDraftStorageKey);
      writeCachedProject(data.project);
      navigate(`/editor/${data.project.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setGenerating(false);
      setLoadingStartedAt(null);
    }
  }

  function updateBusinessBrief(patch) {
    setBusinessBrief((current) => ({
      ...current,
      ...patch
    }));
  }

  return (
    <AppShell>
      {generating ? (
        <main className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
          <div className="mb-7 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5b4bd1] text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-black tracking-tight">
              SiteForge <span className="text-accent">AI</span>
            </span>
          </div>
          <Loader2 className="mb-7 h-16 w-16 animate-spin text-accent" />
          <h2 className="font-display text-3xl font-black text-ink">
            {isImageMode ? "Generating your logos..." : "Building your website..."}
          </h2>
          <p className="mt-3 max-w-sm text-base font-semibold leading-7 text-muted">
            {loadingSteps[loadingStepIndex]}
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-500">
            {elapsedSeconds < 12
              ? "Keeping the request active..."
              : `Still working - ${elapsedSeconds}s elapsed. AI image generation can take a little longer.`}
          </p>
        </main>
      ) : null}

      <main className="relative flex h-[calc(100vh-4.25rem)] items-center justify-center overflow-hidden bg-[#f4f2fb] px-4 py-3">
        <div className="absolute inset-0 auth-soft-stage" />
        <section className="relative mx-auto w-full max-w-5xl animate-fade-in">
          <form onSubmit={generateWebsite} className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b4bd1] text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="font-display text-xl font-black tracking-tight">
                  SiteForge <span className="text-accent">AI</span>
                </span>
              </div>
            </div>

            <h1
              className="mx-auto flex max-w-5xl flex-nowrap items-baseline justify-center gap-x-3 overflow-visible whitespace-nowrap text-center font-display text-xl font-black leading-tight tracking-normal text-ink sm:text-3xl"
              aria-live="polite"
              title={displayHeadline}
            >
              <span>{headlinePrefix} — </span>
              <span
                className="inline-block min-h-[1.1em] text-left"
              >
                {typedHeadlineSuffix}
                <span className="ml-1 inline-block h-[0.9em] w-[0.08em] translate-y-[0.08em] animate-pulse rounded-full bg-ink" aria-hidden="true" />
              </span>
            </h1>

            <div className="mt-3 min-h-[400px] rounded-[22px] border border-[#d9d3f2] bg-white p-4 shadow-[0_18px_48px_rgba(58,48,112,0.11)]">
              <div className="mb-3 rounded-2xl bg-[#f3f1fb] p-1">
                <div className="relative grid grid-cols-2">
                  <span
                    className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-xl bg-white shadow-[0_10px_26px_rgba(77,63,148,0.14)] transition-transform duration-200 ease-out will-change-transform ${
                      isImageMode ? "translate-x-full" : "translate-x-0"
                    }`}
                    aria-hidden="true"
                  />
                  {[
                    ["website", Sparkles, "Website"],
                    ["images", ImagePlus, "AI Images"]
                  ].map(([key, Icon, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      aria-pressed={mode === key}
                      className={`relative z-10 flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-black transition-colors duration-200 ${
                        mode === key ? "text-[#5b4bd1]" : "text-slate-500 hover:text-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={isImageMode ? "Describe the logo, brand, colors, and style you want..." : "Describe your business..."}
                className="min-h-44 resize-none rounded-xl !border-transparent !bg-[#f3f1fb] px-4 py-3 text-sm font-semibold leading-6 !shadow-none outline-none placeholder:text-slate-500/75 hover:!border-transparent hover:!bg-[#efecf8] focus:!border-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
                aria-label={isImageMode ? "AI image prompt" : "Website prompt"}
              />

              {!isImageMode ? (
                <div className="mt-3 min-h-[94px] text-left">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <Input
                      placeholder="Business name"
                      value={businessBrief.businessName}
                      onChange={(event) => updateBusinessBrief({ businessName: event.target.value })}
                      className="h-10 rounded-xl border-transparent !bg-[#f3f1fb] text-sm font-semibold hover:!bg-[#efecf8] focus:border-transparent focus:ring-0"
                      aria-label="Business name"
                    />
                    <Input
                      placeholder="Industry"
                      value={businessBrief.industry}
                      onChange={(event) => updateBusinessBrief({ industry: event.target.value })}
                      className="h-10 rounded-xl border-transparent !bg-[#f3f1fb] text-sm font-semibold hover:!bg-[#efecf8] focus:border-transparent focus:ring-0"
                      aria-label="Industry"
                    />
                    <Input
                      placeholder="Target audience"
                      value={businessBrief.targetAudience}
                      onChange={(event) => updateBusinessBrief({ targetAudience: event.target.value })}
                      className="h-10 rounded-xl border-transparent !bg-[#f3f1fb] text-sm font-semibold hover:!bg-[#efecf8] focus:border-transparent focus:ring-0"
                      aria-label="Target audience"
                    />
                    <div ref={toneMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setToneMenuOpen((open) => !open)}
                        className="group flex h-10 w-full items-center overflow-hidden rounded-xl border border-transparent bg-[#f3f1fb] text-left text-sm font-semibold text-ink outline-none transition hover:bg-[#efecf8] focus:ring-0"
                        aria-expanded={toneMenuOpen}
                        aria-label="Tone"
                      >
                        <span className={`min-w-0 flex-1 truncate px-3 ${businessBrief.toneStyle ? "text-ink" : "text-slate-500/75"}`}>
                          {businessBrief.toneStyle || "Tone"}
                        </span>
                        <span className="flex h-full w-10 shrink-0 items-center justify-center bg-[#d9d3f2] text-[#5b4bd1] transition group-hover:bg-[#cec5ef]">
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${toneMenuOpen ? "rotate-180" : ""}`} />
                        </span>
                      </button>
                      {toneMenuOpen ? (
                        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#d9d3f2] bg-white p-1.5 shadow-[0_18px_42px_rgba(77,63,148,0.16)]">
                          <div className="grid gap-1">
                          {toneOptions.map((tone) => {
                            const active = businessBrief.toneStyle === tone;

                            return (
                              <button
                                key={tone}
                                type="button"
                                onClick={() => {
                                  updateBusinessBrief({ toneStyle: tone });
                                  setToneMenuOpen(false);
                                }}
                                className={`flex h-8 w-full items-center rounded-lg px-3 text-left text-sm font-bold transition ${
                                  active ? "bg-[#f3f1fb] text-[#5b4bd1]" : "text-slate-700 hover:bg-[#f8f6ff] hover:text-ink"
                                }`}
                              >
                                {tone}
                              </button>
                            );
                          })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  loading={generating}
                  disabled={!canGenerate}
                  className="min-w-52 rounded-2xl bg-[#5b4bd1] shadow-[0_14px_34px_rgba(91,75,209,0.24)] hover:bg-[#4f41bd]"
                >
                  {isImageMode ? <ImagePlus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  {isImageMode ? "Generate Logos" : "Generate Website"}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {activeExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    if (isImageMode) {
                      setPrompt(example);
                    } else {
                      setBusinessBrief((current) => ({ ...current, businessName: example }));
                    }
                  }}
                  className="rounded-full border border-[#d9d3f2] bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-[0_8px_20px_rgba(77,63,148,0.10)] transition hover:border-[#6657dc]/40 hover:bg-[#f3f1fb] hover:text-[#5b4bd1]"
                >
                  {example}
                </button>
              ))}
            </div>

            {error ? (
              <div className="mx-auto mt-3 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </form>
        </section>
      </main>
    </AppShell>
  );
}
