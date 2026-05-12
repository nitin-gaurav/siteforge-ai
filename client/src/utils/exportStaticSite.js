function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function imageMarkup(image, className = "section-image") {
  if (!image?.url) return "";
  return `<img class="${className}" src="${escapeAttribute(image.url)}" alt="${escapeAttribute(image.alt || "Website image")}" loading="lazy" />`;
}

function cardMarkup(item) {
  return `
    <article class="card">
      ${item.meta ? `<p class="meta">${escapeHtml(item.meta)}</p>` : ""}
      <h3>${escapeHtml(item.title || "Untitled")}</h3>
      <p>${escapeHtml(item.body || "")}</p>
    </article>
  `;
}

function renderSection(section, allSections) {
  const title = escapeHtml(section.title || "");
  const body = escapeHtml(section.body || "");
  const cta = escapeHtml(section.cta || "");
  const cards = Array.isArray(section.items) ? section.items : [];

  if (section.type === "hero") {
    return `
      <section class="section hero">
        <div>
          <h1>${title}</h1>
          <p class="lead">${body}</p>
          ${cta ? `<a class="button" href="#contact">${cta}</a>` : ""}
        </div>
        ${imageMarkup(section.image)}
      </section>
    `;
  }

  if (section.type === "cta") {
    return `
      <section class="section cta" id="contact">
        <div>
          <p class="eyebrow">Next Step</p>
          <h2>${title}</h2>
          <p>${body}</p>
          ${cta ? `<a class="button button-light" href="mailto:hello@example.com">${cta}</a>` : ""}
        </div>
        ${imageMarkup(section.image)}
      </section>
    `;
  }

  if (section.type === "graphics") {
    return `
      <section class="section">
        <p class="eyebrow">AI Image Generation</p>
        <h2>${title}</h2>
        <p>${body}</p>
        <div class="grid three">
          ${cards.slice(0, 3).map((item) => `
            <article class="card image-card">
              ${imageMarkup(item.image, "card-image")}
              ${item.meta ? `<p class="meta">${escapeHtml(item.meta)}</p>` : ""}
              <h3>${escapeHtml(item.title || "Generated graphic")}</h3>
              <p>${escapeHtml(item.body || "")}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  if (section.type === "sidebar") {
    return `
      <section class="section sidebar-layout">
        <aside>
          <p class="eyebrow">Explore</p>
          <h2>${title}</h2>
          <p>${body}</p>
        </aside>
        <div class="grid">
          ${cards.map(cardMarkup).join("")}
        </div>
      </section>
    `;
  }

  return `
    <section class="section">
      ${imageMarkup(section.image)}
      <p class="eyebrow">${escapeHtml(section.type || "Section")}</p>
      <h2>${title}</h2>
      <p>${body}</p>
      ${cards.length ? `<div class="grid ${cards.length >= 3 ? "three" : ""}">${cards.map(cardMarkup).join("")}</div>` : ""}
      ${section.cta ? `<a class="button" href="#contact">${cta}</a>` : ""}
    </section>
  `;
}

export function buildStaticSiteHtml({ name, sections, theme }) {
  const safeName = escapeHtml(name || "Generated Website");
  const safeTheme = {
    primary: theme?.primary || "#2f6fed",
    background: theme?.background || "#ffffff",
    text: theme?.text || "#101418"
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeName}</title>
  <style>
    :root {
      --primary: ${escapeHtml(safeTheme.primary)};
      --background: ${escapeHtml(safeTheme.background)};
      --text: ${escapeHtml(safeTheme.text)};
      --muted: #64748b;
      --line: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--background); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    a { color: inherit; }
    .site { overflow: hidden; }
    .section { max-width: 1120px; margin: 0 auto; padding: 72px 24px; }
    .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 0.85fr); align-items: center; gap: 48px; min-height: 680px; }
    .eyebrow { margin: 0 0 14px; color: var(--primary); font-size: 13px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
    h1, h2, h3, p { overflow-wrap: anywhere; }
    h1 { margin: 0; max-width: 780px; font-size: clamp(44px, 7vw, 76px); line-height: .98; letter-spacing: 0; }
    h2 { margin: 0; max-width: 760px; font-size: clamp(30px, 4vw, 48px); line-height: 1.05; letter-spacing: 0; }
    h3 { margin: 10px 0 8px; font-size: 22px; line-height: 1.2; }
    p { color: var(--muted); font-size: 18px; line-height: 1.75; }
    .lead { margin-top: 24px; max-width: 680px; font-size: 22px; }
    .button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; margin-top: 24px; border-radius: 8px; background: var(--primary); color: #fff; padding: 0 22px; font-weight: 900; text-decoration: none; }
    .button-light { background: #fff; color: var(--text); }
    .section-image { width: 100%; aspect-ratio: 4 / 3; border-radius: 8px; object-fit: cover; box-shadow: 0 24px 70px rgba(15, 23, 42, .14); }
    .grid { display: grid; gap: 18px; margin-top: 28px; }
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .card { border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 22px; box-shadow: 0 10px 30px rgba(15, 23, 42, .06); }
    .image-card { overflow: hidden; padding: 0; }
    .image-card h3, .image-card p, .image-card .meta { margin-left: 18px; margin-right: 18px; }
    .image-card p:last-child { margin-bottom: 18px; }
    .card-image { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
    .meta { color: var(--primary); font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
    .sidebar-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 28px; }
    .sidebar-layout aside, .cta { border-radius: 8px; background: var(--primary); color: #fff; }
    .sidebar-layout aside { padding: 24px; }
    .sidebar-layout aside p, .sidebar-layout aside .eyebrow, .cta p, .cta .eyebrow { color: rgba(255,255,255,.82); }
    .cta { max-width: 1120px; padding: 48px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 32px; align-items: center; }
    @media (max-width: 760px) {
      .section { padding: 48px 18px; }
      .hero, .sidebar-layout, .cta { grid-template-columns: 1fr; min-height: auto; }
      .three { grid-template-columns: 1fr; }
      .cta { border-radius: 0; padding: 42px 18px; }
    }
  </style>
</head>
<body>
  <main class="site">
    ${(sections || []).map((section) => renderSection(section, sections || [])).join("\n")}
  </main>
</body>
</html>`;
}

export function downloadStaticSite(project) {
  const html = buildStaticSiteHtml(project);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "index.html";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
