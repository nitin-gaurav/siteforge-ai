import React from "react";

const colorFields = [
  { key: "primary", label: "Primary" },
  { key: "background", label: "Canvas" },
  { key: "text", label: "Text" }
];

const themePresets = [
  {
    name: "Studio Blue",
    description: "Clean SaaS and service pages",
    theme: { primary: "#2f6fed", background: "#ffffff", text: "#101418" }
  },
  {
    name: "Cafe Warm",
    description: "Coffee, bakery, and local shops",
    theme: { primary: "#9a5a2e", background: "#fff8f0", text: "#24150d" }
  },
  {
    name: "Fresh Green",
    description: "Wellness, food, and eco brands",
    theme: { primary: "#14845f", background: "#f4fbf7", text: "#0f1f19" }
  },
  {
    name: "Bold Coral",
    description: "Events, creators, and promos",
    theme: { primary: "#e24d42", background: "#fff7f5", text: "#1f1715" }
  },
  {
    name: "Premium Ink",
    description: "Luxury, portfolio, and agencies",
    theme: { primary: "#c59b45", background: "#111111", text: "#f8f5ed" }
  },
  {
    name: "Soft Violet",
    description: "Education and modern products",
    theme: { primary: "#6657dc", background: "#fbfaff", text: "#18142f" }
  }
];

function hexToReadable(hex) {
  if (!hex) return "-";
  return hex.toUpperCase();
}

export default function ThemePanel({ theme, onThemeChange }) {
  return (
    <div className="grid gap-3 p-3">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Theme Presets</p>
        <div className="grid gap-2">
          {themePresets.map((preset) => {
            const isActive =
              theme.primary?.toLowerCase() === preset.theme.primary.toLowerCase() &&
              theme.background?.toLowerCase() === preset.theme.background.toLowerCase() &&
              theme.text?.toLowerCase() === preset.theme.text.toLowerCase();

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onThemeChange(preset.theme)}
                className={`grid gap-2 rounded-lg border bg-white p-2.5 text-left shadow-sm transition hover:border-accent/30 hover:bg-panel ${
                  isActive ? "border-accent/40 ring-2 ring-accent/10" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink">{preset.name}</p>
                    <p className="truncate text-[11px] font-semibold text-muted">{preset.description}</p>
                  </div>
                  <div className="flex shrink-0 overflow-hidden rounded-md border border-line">
                    {Object.values(preset.theme).map((color) => (
                      <span key={color} className="h-7 w-7" style={{ background: color }} />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Custom Colors</p>
      {colorFields.map(({ key, label }) => (
        <label
          key={key}
          className="grid cursor-pointer gap-1.5 rounded-lg border border-line bg-white p-2.5 shadow-sm transition hover:border-accent/30 hover:bg-panel"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink">{label}</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted/70">
              {hexToReadable(theme[key])}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-md border border-line shadow-sm" style={{ background: theme[key] || "#ffffff" }} />
            <input
              className="h-7 min-w-0 flex-1 cursor-pointer rounded-md border border-line bg-white px-1"
              type="color"
              value={theme[key] || "#000000"}
              onChange={(event) => onThemeChange({ [key]: event.target.value })}
            />
          </div>
        </label>
      ))}
      </div>
    </div>
  );
}
