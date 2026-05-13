import React, { useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, Wand2, X } from "lucide-react";
import { api } from "../../services/api.js";

const quickActions = [
  "Improve copy",
  "Make modern",
  "Stronger CTA",
  "Dark theme"
];

function updateLabel(result) {
  const sectionCount = result?.updates?.sections?.length || 0;
  const themeChanged = Boolean(result?.updates?.theme && Object.keys(result.updates.theme).length);

  if (sectionCount && themeChanged) return `${sectionCount} section update${sectionCount === 1 ? "" : "s"} + theme`;
  if (sectionCount) return `${sectionCount} section update${sectionCount === 1 ? "" : "s"}`;
  if (themeChanged) return "Theme update";
  return "No project edits";
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      SiteForge AI is editing
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
      </span>
    </div>
  );
}

export default function AiWebsiteAssistant({ project, onApplyUpdates }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask for focused edits to copy, CTAs, sections, tone, or theme.",
      meta: "Editor assistant"
    }
  ]);
  const inputRef = useRef(null);

  const canEdit = useMemo(() => Array.isArray(project.sections) && project.sections.length > 0, [project.sections]);

  async function submitAssistantRequest(nextInstruction = input) {
    const instruction = nextInstruction.trim();
    if (!instruction || loading || !canEdit) return;

    setOpen(true);
    setInput("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: instruction
      }
    ]);

    try {
      const result = await api.assistSite(project, instruction);
      onApplyUpdates(result.updates);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.message || "Applied structured website edits.",
          meta: updateLabel(result)
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: error.message || "Could not apply assistant edits.",
          meta: "Request failed"
        }
      ]);
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitAssistantRequest();
  }

  return (
    <div className="fixed bottom-4 right-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:bottom-5 sm:right-5 sm:max-w-[calc(100vw-2.5rem)]">
      <div
        className={`w-[380px] max-w-full origin-bottom-right overflow-hidden rounded-2xl border border-white/80 bg-[#fbfaff]/95 shadow-[0_22px_70px_rgba(24,31,54,0.22)] backdrop-blur-xl transition-all duration-300 ease-spring ${
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#eee9fb] bg-white/85 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-white">
              <Bot className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-ink">SiteForge AI</p>
              <p className="truncate text-xs font-bold text-muted">Structured website edits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            aria-label="Close SiteForge AI"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[360px] min-h-[260px] overflow-y-auto px-4 py-4">
          <div className="grid gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`animate-fade-in ${message.role === "user" ? "ml-8 justify-self-end" : "mr-8 justify-self-start"}`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "bg-ink text-white"
                      : "border border-[#eee9fb] bg-white text-slate-700"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.meta ? (
                    <p className={`mt-2 text-[11px] font-black uppercase tracking-[0.12em] ${message.role === "user" ? "text-white/60" : "text-accent"}`}>
                      {message.meta}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {loading ? <TypingIndicator /> : null}
          </div>
        </div>

        <div className="border-t border-[#eee9fb] bg-white/80 p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => submitAssistantRequest(action)}
                disabled={loading || !canEdit}
                className="rounded-full border border-[#e5e0f6] bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-accent/30 hover:bg-[#f4f1ff] hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Make this website more premium"
              className="min-h-11 max-h-28 flex-1 resize-none rounded-xl border border-[#e5e0f6] bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-[#e5e0f6] focus:ring-0"
              rows={1}
              disabled={loading || !canEdit}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || !canEdit}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send instruction"
              title="Send"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setOpen((nextOpen) => !nextOpen);
          window.setTimeout(() => inputRef.current?.focus(), 80);
        }}
        className="group flex min-h-11 items-center gap-2 rounded-full bg-ink px-3.5 py-2.5 text-xs font-black text-white shadow-[0_16px_45px_rgba(13,17,23,0.28)] transition hover:-translate-y-0.5 hover:bg-[#171d29] sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/12 transition group-hover:bg-white/18">
          <Sparkles className="h-4 w-4" />
        </span>
        <span>Ask SiteForge AI</span>
        <Wand2 className="h-4 w-4 text-white/70" />
      </button>
    </div>
  );
}
