import React from "react";
import { ArrowRight, BarChart3, Calendar, Coffee, Download, Mail, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function actionKind(section) {
  const text = `${section.title || ""} ${section.body || ""} ${section.cta || ""}`.toLowerCase();

  if (text.includes("menu") || text.includes("coffee") || text.includes("restaurant") || text.includes("food")) {
    return "menu";
  }

  if (text.includes("ranking") || text.includes("rank") || text.includes("leaderboard") || text.includes("top ")) {
    return "ranking";
  }

  if (text.includes("demo") || text.includes("book") || text.includes("schedule")) {
    return "booking";
  }

  return "contact";
}

function ActionModal({ section, theme, onClose }) {
  const kind = actionKind(section);
  const rankingItems = section.items?.length
    ? section.items
    : [
        { title: "#1 Solo Leveling", body: "Leading the month with explosive action momentum and fan buzz.", meta: "Rank 01" },
        { title: "#2 Frieren", body: "A thoughtful fantasy favorite with strong audience loyalty.", meta: "Rank 02" },
        { title: "#3 Jujutsu Kaisen", body: "Battle choreography and dramatic stakes keep it high on the board.", meta: "Rank 03" }
      ];

  const menuItems = [
    ["Signature Roast", "Balanced, smooth, and rich with caramel notes.", "$4.50"],
    ["Cold Brew Flight", "Three seasonal cold brews served over crystal-clear ice.", "$8.00"],
    ["Bakery Pairing", "Fresh pastry with a handcrafted espresso drink.", "$7.50"]
  ];

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/30 p-4" onClick={onClose} role="presentation">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md bg-white shadow-soft"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {kind === "menu" ? "Featured menu" : kind === "ranking" ? "Current leaderboard" : kind === "booking" ? "Book a time" : "Get in touch"}
            </p>
            <h3 className="mt-1 text-2xl font-black text-ink">{section.cta || "Next step"}</h3>
          </div>
          <button type="button" className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" onClick={onClose} aria-label="Close preview modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        {kind === "ranking" ? (
          <div className="grid gap-3 p-4">
            {rankingItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex gap-4 rounded-md border border-slate-200 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white" style={{ background: theme.primary }}>
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>
                    {item.meta || `Rank ${String(index + 1).padStart(2, "0")}`}
                  </p>
                  <h4 className="mt-1 break-words font-black text-ink">{item.title}</h4>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        ) : kind === "menu" ? (
          <div className="grid gap-3 p-4">
            {menuItems.map(([name, description, price]) => (
              <div key={name} className="flex gap-4 rounded-md border border-slate-200 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white" style={{ background: theme.primary }}>
                  <Coffee className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-black text-ink">{name}</h4>
                    <span className="font-black" style={{ color: theme.primary }}>
                      {price}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form className="grid gap-3 p-4">
            <label className="grid gap-2 text-sm font-bold text-ink">
              Name
              <input className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:ring-4 focus:ring-blue-100" placeholder="Your name" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Email
              <input className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Message
              <textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100" placeholder="Tell us what you need" />
            </label>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <p className="text-sm text-slate-600">
            {kind === "menu" || kind === "ranking" ? "Generated preview content. Edit sections to customize it." : "This is a preview interaction for the generated website."}
          </p>
          <button type="button" className="flex min-h-10 items-center gap-2 rounded-md px-4 font-bold text-white" style={{ background: theme.primary }} onClick={onClose}>
            {kind === "booking" ? <Calendar className="h-4 w-4" /> : kind === "ranking" ? <BarChart3 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CtaButton({ children, section, sections = [], theme, variant = "primary" }) {
  const [open, setOpen] = useState(false);
  const rankingSource = sections.find((nextSection) => nextSection.items?.length && actionKind(nextSection) === "ranking");
  const modalSection = actionKind(section) === "ranking" && !section.items?.length && rankingSource
    ? { ...section, items: rankingSource.items }
    : section;
  const className =
    variant === "inverse"
      ? "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 font-bold text-ink transition hover:-translate-y-0.5 hover:shadow-lg sm:w-fit"
      : "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg sm:w-fit";

  return (
    <>
      <button
        className={className}
        style={variant === "primary" ? { background: theme.primary } : undefined}
        onClick={() => setOpen(true)}
        type="button"
      >
        {children}
        <ArrowRight className="h-4 w-4" />
      </button>
      {open ? <ActionModal section={modalSection} theme={theme} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function SectionImage({ className, image }) {
  const [failed, setFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = React.useRef(null);
  const isFallbackPlaceholder = image?.credit?.startsWith("Local fallback");
  const isInlineImage = image?.url?.startsWith("data:image/");

  useEffect(() => {
    setFailed(false);
    setShouldLoad(false);
  }, [image?.url]);

  useEffect(() => {
    if (!image?.url || failed || isFallbackPlaceholder) return undefined;

    if (!isInlineImage) {
      setShouldLoad(true);
      return undefined;
    }

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver !== "function") {
      const timeout = window.setTimeout(() => setShouldLoad(true), 0);
      return () => window.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();
        const schedule = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1));
        const cancel = window.cancelIdleCallback || window.clearTimeout;
        const handle = schedule(() => setShouldLoad(true), { timeout: 600 });

        observer._cancelScheduledLoad = () => cancel(handle);
      },
      { rootMargin: "900px 0px" }
    );

    observer.observe(node);
    return () => {
      observer._cancelScheduledLoad?.();
      observer.disconnect();
    };
  }, [failed, image?.url, isFallbackPlaceholder, isInlineImage]);

  if (!image?.url || failed || isFallbackPlaceholder || !shouldLoad) {
    return (
      <div ref={containerRef} className={`${className} grid place-items-center overflow-hidden bg-[linear-gradient(135deg,#0f172a,#312e81)] p-6 text-center text-white`}>
        <div className="grid max-w-xs gap-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
            {isFallbackPlaceholder ? "AI image pending" : shouldLoad ? "Image preview" : "Loading image"}
          </p>
          <p className="text-sm font-bold leading-6 text-white/80">{image?.query || image?.alt || "Generated image"}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={containerRef}
      className={className}
      src={image.url}
      alt={image.alt || "Website section image"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function safeFilename(value = "logo") {
  return `${value}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "logo";
}

function isLogoGraphic(item = {}) {
  const text = `${item.title || ""} ${item.meta || ""} ${item.body || ""} ${item.image?.query || ""}`.toLowerCase();
  return text.includes("logo") || text.includes("app icon") || text.includes("brand mark");
}

function isStockLogoImage(image = {}, item = {}) {
  const url = image.url || "";
  const credit = image.credit || "";
  return isLogoGraphic(item) && (url.includes("images.unsplash.com") || /unsplash/i.test(credit));
}

function escapeSvgText(value = "") {
  return `${value}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoPlaceholderImage(item = {}, theme = {}, index = 0) {
  const primary = theme.primary || "#5b5ff4";
  const accentColors = ["#12b981", "#f59e0b", "#38bdf8"];
  const accent = accentColors[index % accentColors.length];
  const label = item.meta || (index === 1 ? "App Icon" : index === 2 ? "Brand Mark" : "Logo");
  const title = item.title || label;
  const initials = title
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "SF";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
          <stop stop-color="${escapeSvgText(primary)}"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
        <linearGradient id="mark" x1="156" y1="132" x2="356" y2="360" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffffff"/>
          <stop offset="1" stop-color="${escapeSvgText(accent)}"/>
        </linearGradient>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.24"/>
        </filter>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#bg)"/>
      <circle cx="108" cy="110" r="78" fill="#ffffff" opacity="0.12"/>
      <circle cx="418" cy="394" r="98" fill="#ffffff" opacity="0.08"/>
      <path d="M256 116l38 92 98 18-74 66 16 100-78-48-78 48 16-100-74-66 98-18 38-92z" fill="url(#mark)" filter="url(#shadow)"/>
      <circle cx="256" cy="256" r="76" fill="#ffffff" opacity="0.94"/>
      <text x="256" y="278" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="900" fill="${escapeSvgText(primary)}">${escapeSvgText(initials)}</text>
      <text x="256" y="430" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="3" fill="#ffffff" opacity="0.78">${escapeSvgText(label.toUpperCase())}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    alt: `${title} logo concept`,
    query: title,
    credit: "Generated logo concept"
  };
}

async function downloadImage(image, filename) {
  if (!image?.url) return;

  const extension = image.url.startsWith("data:image/jpeg") || image.url.includes("fm=jpg") ? "jpg" : "png";
  const link = document.createElement("a");
  link.download = `${safeFilename(filename)}.${extension}`;

  if (image.url.startsWith("data:")) {
    link.href = image.url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  try {
    const response = await fetch(image.url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(image.url, "_blank", "noopener,noreferrer");
  }
}

export default function SectionRenderer({ section, sections = [], theme }) {
  const common = "mx-auto w-full max-w-5xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14";
  const heading = "text-3xl font-black leading-tight sm:text-4xl lg:text-5xl";
  const subheading = "text-2xl font-black leading-tight sm:text-3xl";
  const body = "text-base leading-7 text-slate-600 sm:text-lg sm:leading-8";
  const image = section.image?.url || section.image?.query ? section.image : null;
  const cards = section.items?.length ? section.items : [];

  if (section.type === "hero") {
    return (
      <section className={common} style={{ color: theme.text }}>
        <div className="hero-section-layout grid min-w-0 items-center gap-8">
          <div className="grid gap-6">
            <h1 className={heading}>{section.title}</h1>
            <p className={`max-w-2xl ${body}`}>{section.body}</p>
            {section.cta ? (
              <CtaButton section={section} sections={sections} theme={theme}>
                {section.cta}
              </CtaButton>
            ) : null}
          </div>
          {image ? (
            <SectionImage
              className="aspect-[4/3] w-full max-w-full min-w-0 rounded-md object-cover shadow-soft"
              image={{ ...image, alt: image.alt || section.title }}
            />
          ) : null}
        </div>
      </section>
    );
  }

  if (section.type === "features") {
    return (
      <section className={common}>
        <div className="feature-section-layout grid min-w-0 items-end gap-6">
          <div className="min-w-0">
            <h2 className={subheading}>{section.title}</h2>
            <p className="mt-3 max-w-2xl text-slate-600">{section.body}</p>
          </div>
          {image ? <SectionImage className="aspect-[16/10] w-full max-w-full min-w-0 rounded-md object-cover" image={{ ...image, alt: image.alt || section.title }} /> : null}
        </div>
        {cards.length ? <div className="feature-card-grid mt-8 grid min-w-0 gap-4">
          {cards.map((item, index) => (
            <div key={`${item.title}-${index}`} className="min-w-0 rounded-md border border-slate-200 bg-white p-5">
              {item.meta ? <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>{item.meta}</p> : null}
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div> : null}
      </section>
    );
  }

  if (section.type === "about") {
    return (
      <section className={common}>
        <div className="feature-section-layout grid min-w-0 items-center gap-8">
          {image ? <SectionImage className="aspect-[16/11] w-full max-w-full min-w-0 rounded-md object-cover shadow-sm" image={{ ...image, alt: image.alt || section.title }} /> : null}
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: theme.primary }}>
              About
            </p>
            <h2 className={`${subheading} mt-2`}>{section.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{section.body}</p>
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "services") {
    const serviceItems = cards.length
      ? cards
      : [
          { title: "Core Service", body: "The main service customers come for.", meta: "01" },
          { title: "Customer Support", body: "Helpful guidance for every customer.", meta: "02" },
          { title: "Custom Solutions", body: "Flexible options for unique needs.", meta: "03" }
        ];

    return (
      <section className={common}>
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: theme.primary }}>
            Services
          </p>
          <h2 className={`${subheading} mt-2`}>{section.title}</h2>
          <p className="mt-3 text-slate-600">{section.body}</p>
        </div>
        <div className="feature-card-grid mt-8 grid min-w-0 gap-4">
          {serviceItems.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>
                {item.meta || `0${index + 1}`}
              </p>
              <h3 className="font-black text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "faq") {
    const faqItems = cards.length
      ? cards
      : [
          { title: "How do I get started?", body: "Use the call-to-action or contact the business directly." },
          { title: "Who is this for?", body: "Customers who need a reliable solution in this category." },
          { title: "Can I request something custom?", body: "Yes, options can be tailored to customer needs." }
        ];

    return (
      <section className={common}>
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: theme.primary }}>
            FAQ
          </p>
          <h2 className={`${subheading} mt-2`}>{section.title}</h2>
          <p className="mt-3 text-slate-600">{section.body}</p>
        </div>
        <div className="mt-8 grid gap-3">
          {faqItems.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-md border border-slate-200 bg-white p-5">
              <h3 className="font-black text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "contact") {
    const contactItems = cards.length
      ? cards
      : [
          { title: "Phone", body: "Add the best number for customer inquiries.", meta: "Call" },
          { title: "Email", body: "Add the primary email for messages and bookings.", meta: "Email" },
          { title: "Location", body: "Add an address, service area, or online availability.", meta: "Visit" }
        ];

    return (
      <section className={common}>
        <div className="grid gap-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: theme.primary }}>
              Contact
            </p>
            <h2 className={`${subheading} mt-2`}>{section.title}</h2>
            <p className="mt-3 text-slate-600">{section.body}</p>
          </div>
          <div className="feature-card-grid grid min-w-0 gap-4">
            {contactItems.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-md border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>
                  {item.meta || "Contact"}
                </p>
                <h3 className="mt-2 font-black text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
          {section.cta ? (
            <CtaButton section={section} sections={sections} theme={theme}>
              {section.cta}
            </CtaButton>
          ) : null}
        </div>
      </section>
    );
  }

  if (section.type === "seo") {
    const seoItems = cards.length
      ? cards
      : [
          { title: "Suggested page title", body: section.title, meta: "Title" },
          { title: "Meta description", body: section.body, meta: "Meta" },
          { title: "Keyword focus", body: "Primary service, audience, and location keywords.", meta: "SEO" }
        ];

    return (
      <section className={common}>
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: theme.primary }}>
            SEO content
          </p>
          <h2 className={`${subheading} mt-2`}>{section.title}</h2>
          <p className="mt-3 text-slate-600">{section.body}</p>
        </div>
        <div className="mt-8 grid gap-3">
          {seoItems.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-md border border-slate-200 bg-white p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>
                {item.meta || "SEO"}
              </p>
              <h3 className="font-black text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "graphics") {
    const graphicItems = cards.length
      ? cards
      : [
          { title: "Primary logo concept", body: "A square logo mark for the brand.", meta: "Logo" },
          { title: "App icon concept", body: "A compact icon version for apps and profiles.", meta: "App Icon" },
          { title: "Brand mark concept", body: "A simplified symbol for flexible brand use.", meta: "Brand Mark" }
        ];

    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-7">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: theme.primary }}>
              Logo generation
            </p>
            <h2 className={`${subheading} mt-2`}>{section.title}</h2>
            <p className="mt-3 text-slate-600">{section.body}</p>
          </div>

          <div className="feature-card-grid mt-1 grid min-w-0 gap-4">
            {graphicItems.slice(0, 3).map((item, index) => {
                const displayImage = item.image;
                const fallbackImage = index === 0 && image ? image : null;
                const generatedLogoImage = isLogoGraphic(item) && !displayImage?.url && !fallbackImage?.url
                  ? logoPlaceholderImage(item, theme, index)
                  : null;
                const logoImage = displayImage || fallbackImage || generatedLogoImage;

                return (
              <article key={`${item.title}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="graphic-logo-stage grid place-items-center bg-[linear-gradient(135deg,#f8fafc,#eef2ff)] p-4 sm:p-5">
                  <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)] sm:max-w-[260px]">
                    {logoImage?.url ? (
                      <SectionImage className="h-full w-full object-contain" image={{ ...logoImage, alt: logoImage.alt || item.title }} />
                    ) : (
                      <div className="grid h-full place-items-center p-5 text-center text-white" style={{ background: theme.primary }}>
                        <div>
                          <div className="mx-auto mb-4 h-14 w-14 rounded-md bg-white/18" />
                          <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">{item.meta || "Logo"}</p>
                          <p className="mt-2 text-lg font-black leading-tight">{item.title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>
                    {item.meta || `Logo ${index + 1}`}
                  </p>
                  <h3 className="mt-2 font-black text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  <button
                    type="button"
                    onClick={() => downloadImage(logoImage, item.title || `logo-${index + 1}`)}
                    disabled={!logoImage?.url}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-ink transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Export logo
                  </button>
                </div>
              </article>
                );
              })}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "testimonial") {
    return (
      <section className={common}>
        {image ? <SectionImage className="mb-8 aspect-[16/9] w-full rounded-md object-cover sm:aspect-[16/7]" image={{ ...image, alt: image.alt || section.title }} /> : null}
        <blockquote className="border-l-4 py-2 pl-4 text-xl font-bold leading-8 sm:pl-6 sm:text-2xl sm:leading-10" style={{ borderColor: theme.primary }}>
          {section.body}
        </blockquote>
        <p className="mt-4 text-sm font-semibold text-slate-500">{section.title}</p>
      </section>
    );
  }

  if (section.type === "sidebar") {
    const sidebarItems = cards.length
      ? cards
      : [
          { title: "Overview", body: "Start with the main story and key highlights." },
          { title: "Categories", body: "Browse by topic, ranking, or feature." },
          { title: "Featured", body: "Jump to the most important content." }
        ];

    return (
      <section className={common}>
        <div className="grid min-w-0 gap-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[260px_1fr] lg:p-6">
          <aside className="min-w-0 rounded-md p-4 text-white" style={{ background: theme.primary }}>
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-75">Sidebar</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 opacity-85">{section.body}</p>
            <nav className="mt-5 grid gap-2">
              {sidebarItems.map((item, index) => (
                <a
                  key={`${item.title}-${index}`}
                  href={`#sidebar-item-${index + 1}`}
                  className="rounded-md bg-white/12 px-3 py-2 text-sm font-bold transition hover:bg-white/20"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {image ? (
              <SectionImage
                className="mb-4 aspect-[16/7] w-full rounded-md object-cover"
                image={{ ...image, alt: image.alt || section.title }}
              />
            ) : null}
            <div className="grid gap-3">
              {sidebarItems.map((item, index) => (
                <article id={`sidebar-item-${index + 1}`} key={`${item.title}-panel-${index}`} className="rounded-md border border-slate-200 p-4">
                  {item.meta ? <p className="mb-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.primary }}>{item.meta}</p> : null}
                  <h3 className="font-black text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={common}>
      <div className="cta-section-layout grid min-w-0 overflow-hidden rounded-md text-white" style={{ background: theme.primary }}>
        <div className="min-w-0 p-5 sm:p-8">
          <h2 className={subheading}>{section.title}</h2>
          <p className="mt-3 max-w-2xl opacity-90">{section.body}</p>
          {section.cta ? (
            <div className="mt-6">
              <CtaButton section={section} sections={sections} theme={theme} variant="inverse">
              {section.cta}
              </CtaButton>
            </div>
          ) : null}
        </div>
        {image ? <SectionImage className="h-full min-h-48 w-full object-cover sm:min-h-64" image={{ ...image, alt: image.alt || section.title }} /> : null}
      </div>
    </section>
  );
}
