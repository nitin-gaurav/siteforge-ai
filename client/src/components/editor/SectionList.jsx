import React from "react";
import { ChevronDown, Plus, Trash2, GripVertical, Image, RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";

const sectionTypes = [
  { key: "about", label: "About", color: "bg-cyan-100 text-cyan-700" },
  { key: "services", label: "Services", color: "bg-blue-100 text-blue-700" },
  { key: "faq", label: "FAQ", color: "bg-amber-100 text-amber-700" },
  { key: "features", label: "Features", color: "bg-blue-100 text-blue-700" },
  { key: "sidebar", label: "Sidebar", color: "bg-slate-100 text-slate-700" },
  { key: "testimonial", label: "Testimonial", color: "bg-purple-100 text-purple-700" },
  { key: "cta", label: "CTA", color: "bg-orange-100 text-orange-700" }
];

const typeColorMap = {
  hero: "bg-emerald-100 text-emerald-700",
  about: "bg-cyan-100 text-cyan-700",
  services: "bg-blue-100 text-blue-700",
  faq: "bg-amber-100 text-amber-700",
  features: "bg-blue-100 text-blue-700",
  graphics: "bg-indigo-100 text-indigo-700",
  sidebar: "bg-slate-100 text-slate-700",
  testimonial: "bg-purple-100 text-purple-700",
  cta: "bg-orange-100 text-orange-700"
};

export default function SectionList({ sections, onAdd, onRemove, onUpdate, onRegenerate, onReorder, regeneratingId, expanded = false }) {
  const [openId, setOpenId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const previousLength = useRef(sections.length);
  const shouldOpenAddedSection = useRef(false);

  useEffect(() => {
    if (shouldOpenAddedSection.current && sections.length > previousLength.current) {
      setOpenId(sections.at(-1)?.id ?? null);
    }
    shouldOpenAddedSection.current = false;
    previousLength.current = sections.length;
  }, [sections]);

  return (
    <div className="grid gap-3 p-3">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Add Section</p>
        <div className={`grid gap-2 ${expanded ? "grid-cols-3" : "grid-cols-2"}`}>
          {sectionTypes.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => {
                shouldOpenAddedSection.current = true;
                onAdd(key);
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-accent/30 hover:bg-panel hover:text-ink active:scale-95"
              title={`Add ${label}`}
            >
              <Plus className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line bg-white py-7 text-center">
          <p className="text-sm font-medium text-muted">No sections yet.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {sections.map((section, index) => {
            const isOpen = openId === section.id;
            const isDragging = draggingId === section.id;
            const badgeColor = typeColorMap[section.type] || "bg-slate-100 text-slate-600";

            return (
              <div
                key={section.id}
                draggable
                onDragStart={(event) => {
                  setDraggingId(section.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isInteger(fromIndex)) {
                    onReorder?.(fromIndex, index);
                  }
                  setDraggingId(null);
                }}
                className={`overflow-hidden rounded-lg border transition-all duration-200 ${
                  isDragging
                    ? "border-accent bg-white opacity-60 shadow-lg"
                    : isOpen
                    ? "border-accent/30 bg-white shadow-sm"
                    : "border-line bg-white shadow-sm hover:border-accent/20 hover:bg-panel"
                }`}
              >
                {/* Section header */}
                <div className="flex items-center gap-1.5 px-2.5 py-2">
                  <span className="cursor-grab text-muted/30 active:cursor-grabbing" title="Drag to reorder">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => setOpenId(isOpen ? null : section.id)}
                  >
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                      {section.type}
                    </span>
                    <span className="truncate text-sm font-semibold text-ink">
                      {section.title || "Untitled section"}
                    </span>
                    <ChevronDown
                      className={`ml-auto h-4 w-4 shrink-0 text-muted/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <button
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted/50 transition-all hover:bg-[#eef0ff] hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onRegenerate?.(section)}
                    disabled={regeneratingId === section.id}
                    title="Regenerate section"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${regeneratingId === section.id ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted/50 transition-all hover:bg-red-50 hover:text-red-500"
                    onClick={() => onRemove(section.id)}
                    title="Remove section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expandable content */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-spring ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="grid gap-3 border-t border-line/70 p-3">
                      <div className={`grid gap-3 ${expanded ? "grid-cols-2" : ""}`}>
                        <Input
                          label="Title"
                          value={section.title}
                          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                        />
                        <Input
                          label="CTA text"
                          value={section.cta || ""}
                          placeholder="e.g. Get started free"
                          onChange={(e) => onUpdate(section.id, { cta: e.target.value })}
                        />
                      </div>
                      <Textarea
                        label="Body"
                        className={expanded ? "min-h-32" : ""}
                        value={section.body}
                        onChange={(e) => onUpdate(section.id, { body: e.target.value })}
                      />

                      {/* Items */}
                      {section.items?.length ? (
                        <div className="grid gap-3 rounded-xl bg-panel p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Cards / ranking items</p>
                          {section.items.map((item, idx) => (
                            <div key={idx} className={`grid gap-2.5 rounded-xl border border-line bg-white p-3 ${expanded ? "grid-cols-2" : ""}`}>
                              <p className="text-xs font-bold text-muted">Item {idx + 1}</p>
                              <Input
                                label="Title"
                                value={item.title || ""}
                                onChange={(e) =>
                                  onUpdate(section.id, {
                                    items: section.items.map((ni, ni_idx) =>
                                      ni_idx === idx ? { ...ni, title: e.target.value } : ni
                                    )
                                  })
                                }
                              />
                              <Textarea
                                label="Body"
                                className={expanded ? "col-span-2" : ""}
                                value={item.body || ""}
                                onChange={(e) =>
                                  onUpdate(section.id, {
                                    items: section.items.map((ni, ni_idx) =>
                                      ni_idx === idx ? { ...ni, body: e.target.value } : ni
                                    )
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Image */}
                      <div className="grid gap-3 rounded-xl bg-panel p-3">
                        <div className="flex items-center gap-1.5">
                          <Image className="h-3.5 w-3.5 text-muted" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Section image</p>
                        </div>
                        {section.image?.url ? (
                          <img
                            className={`aspect-video w-full rounded-xl border border-line object-cover ${expanded ? "max-h-52" : ""}`}
                            src={section.image.url}
                            alt={section.image.alt || section.title}
                          />
                        ) : null}
                        <div className={`grid gap-3 ${expanded ? "grid-cols-2" : ""}`}>
                          <Input
                            label="Image URL"
                            placeholder="https://example.com/image.jpg"
                            value={section.image?.url || ""}
                            onChange={(e) =>
                              onUpdate(section.id, {
                                image: { ...(section.image || {}), url: e.target.value }
                              })
                            }
                          />
                          <Input
                            label="Alt text"
                            placeholder="Descriptive text for accessibility"
                            value={section.image?.alt || ""}
                            onChange={(e) =>
                              onUpdate(section.id, {
                                image: { ...(section.image || {}), alt: e.target.value }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
