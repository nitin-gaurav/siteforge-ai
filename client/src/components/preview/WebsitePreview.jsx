import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import SectionRenderer from "../sections/SectionRenderer.jsx";

const viewports = {
  desktop: {
    label: "Desktop",
    width: 1200,
    icon: Monitor
  },
  tablet: {
    label: "Tablet",
    width: 768,
    icon: Tablet
  },
  mobile: {
    label: "Mobile",
    width: 390,
    icon: Smartphone
  }
};

function PreviewSkeleton() {
  return (
    <div className="grid gap-8 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <div className="h-4 w-32 rounded shimmer" />
          <div className="h-10 w-3/4 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-2/3 rounded shimmer" />
          <div className="h-11 w-36 rounded shimmer" />
        </div>
        <div className="aspect-[4/3] rounded-md shimmer" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-md shimmer" />
        <div className="h-28 rounded-md shimmer" />
        <div className="h-28 rounded-md shimmer" />
      </div>
    </div>
  );
}

export default function WebsitePreview({ sections, theme, loading = false }) {
  const [viewport, setViewport] = useState("desktop");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const userSelectedViewportRef = useRef(false);
  const activeViewport = viewports[viewport];
  const availableWidth = Math.max(canvasSize.width - 16, 320);
  const availableHeight = Math.max(canvasSize.height - 16, 420);
  const maxScale = viewport === "desktop" ? 1.1 : viewport === "tablet" ? 1.15 : 1.25;
  const previewScale = Math.min(Math.max(availableWidth / activeViewport.width, 0.25), maxScale);
  const visibleFrameHeight = Math.max(availableHeight / previewScale, viewport === "mobile" ? 420 : 520);
  const contentFrameHeight = contentHeight ? contentHeight + 44 : visibleFrameHeight;
  const previewHeight = Math.min(visibleFrameHeight, Math.max(contentFrameHeight, viewport === "mobile" ? 420 : 520));

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCanvasSize({ width, height });
      if (!userSelectedViewportRef.current && width > 0 && width < 640) {
        setViewport("mobile");
      }
    });

    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!contentRef.current) return undefined;

    function updateContentHeight() {
      setContentHeight(contentRef.current?.scrollHeight || 0);
    }

    updateContentHeight();
    const observer = new ResizeObserver(updateContentHeight);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [sections, viewport]);

  return (
    <div className="flex h-full min-h-[620px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/75 bg-white/72 shadow-[0_24px_70px_rgba(77,63,148,0.16)] backdrop-blur-xl lg:min-h-0 lg:rounded-[24px]">
      <div className="flex flex-col gap-3 border-b border-[#eee9fb] bg-white/72 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">Responsive preview</p>
          <p className="truncate text-sm font-semibold text-ink">preview.siteforge.local</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-[#f0eefb] p-1.5 sm:w-auto">
          {Object.entries(viewports).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <button
                key={key}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition sm:gap-2 sm:px-3 sm:text-sm ${
                  viewport === key ? "bg-white text-accent shadow-[0_8px_20px_rgba(77,63,148,0.12)]" : "text-slate-600 hover:bg-white/70"
                }`}
                onClick={() => {
                  userSelectedViewportRef.current = true;
                  setViewport(key);
                }}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={canvasRef} className="checkerboard min-h-0 flex-1 overflow-hidden bg-[#f7f4ff] p-2 sm:p-3">
        <div className="flex h-full justify-center overflow-hidden">
          <div
            className="origin-top transition-all duration-300 ease-spring"
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top center",
              width: activeViewport.width,
              height: previewHeight
            }}
          >
            <div
              className="overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_28px_80px_rgba(77,63,148,0.18)] transition-all duration-300 ease-spring"
              style={{ width: activeViewport.width, height: previewHeight }}
            >
              <div className="flex h-11 items-center gap-2 border-b border-[#eee9fb] bg-white px-4">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 min-w-0 truncate text-xs font-semibold text-slate-500">preview.siteforge.local</span>
                <span className="ml-auto text-xs font-bold text-slate-400">{Math.round(activeViewport.width)}px</span>
              </div>
              <main ref={contentRef} className="website-preview-surface h-[calc(100%-44px)] overflow-y-auto overflow-x-hidden" style={{ background: theme.background }}>
                {loading ? (
                  <PreviewSkeleton />
                ) : (
                  sections.map((section) => (
                    <SectionRenderer key={section.id} section={section} sections={sections} theme={theme} />
                  ))
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
