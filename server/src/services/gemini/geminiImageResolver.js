import { generateGeminiImage } from "./geminiImageService.js";
import { searchUnsplashImage } from "../unsplash/unsplashService.js";

const imageCache = new Map();
const unsplashImageCache = new Map();
const renderImageSectionTypes = new Set(["hero", "about", "features", "graphics", "testimonial", "sidebar", "cta"]);
const defaultLogoImageBudget = Number(process.env.GEMINI_LOGO_IMAGE_BUDGET || 3);
const sectionPriority = {
  hero: 0,
  about: 1,
  features: 2,
  testimonial: 3,
  cta: 4,
  sidebar: 5,
  graphics: 6,
};

function cleanLabel(query = "") {
  return (query || "Generated website image")
    .replace(/\b(generate|create|make|build|website|images?|graphics?|banner|banners|for|a|an|the|only|relevant|business|brief|small|category|industry|target|audience|tone|style)\b/gi, " ")
    .replace(/[^a-z0-9&\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLogoQuery(query = "") {
  const normalized = query.toLowerCase();
  return normalized.includes("logo") || normalized.includes("app icon") || normalized.includes("brand mark");
}

function fallbackWebsiteImage(query = "", index = 0) {
  const label = cleanLabel(query).slice(0, 72) || "Generated website image";
  const palettes = [
    ["#111827", "#4f46e5", "#f8fafc"],
    ["#0f172a", "#14b8a6", "#ecfeff"],
    ["#172554", "#f59e0b", "#fff7ed"],
    ["#1f2937", "#ef4444", "#fef2f2"]
  ];
  const [background, accent, foreground] = palettes[index % palettes.length];
  const safeLabel = label.replace(/[<>&"]/g, "");
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="${background}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="900" fill="url(#g)"/>
  <circle cx="1120" cy="180" r="185" fill="${foreground}" opacity=".14"/>
  <circle cx="250" cy="720" r="230" fill="${foreground}" opacity=".10"/>
  <rect x="92" y="116" width="1216" height="668" rx="44" fill="${foreground}" opacity=".08"/>
  <text x="104" y="430" fill="${foreground}" font-family="Arial, sans-serif" font-size="54" font-weight="800">Image preview</text>
  <text x="104" y="505" fill="${foreground}" opacity=".78" font-family="Arial, sans-serif" font-size="34">${safeLabel}</text>
</svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    alt: query || "Generated website image",
    query,
    credit: "Local fallback graphic",
    creditUrl: ""
  };
}

function fallbackLogoImage(query = "", index = 0) {
  const label = cleanLabel(query)
    .replace(/\b(square|clean|brand|identity|mark|icon|logo|symbol|simple|centered|text|vector|style|minimal|mockup)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28) || "Brand";
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "AI";
  const palettes = [
    ["#0f172a", "#38bdf8", "#ffffff"],
    ["#14532d", "#84cc16", "#f7fee7"],
    ["#312e81", "#a78bfa", "#ffffff"],
    ["#7f1d1d", "#fb7185", "#fff1f2"]
  ];
  const [background, accent, foreground] = palettes[index % palettes.length];
  const safeLabel = label.replace(/[<>&"]/g, "");
  const safeInitials = initials.replace(/[<>&"]/g, "");
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="${background}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#000000" flood-opacity=".24"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <circle cx="760" cy="210" r="155" fill="${foreground}" opacity=".13"/>
  <circle cx="238" cy="790" r="190" fill="${foreground}" opacity=".10"/>
  <g filter="url(#shadow)">
    <rect x="284" y="238" width="456" height="456" rx="128" fill="${foreground}" opacity=".96"/>
    <path d="M512 332l45 120 128 10-98 82 30 126-105-68-105 68 30-126-98-82 128-10 45-120z" fill="${accent}"/>
  </g>
  <text x="512" y="807" text-anchor="middle" fill="${foreground}" font-family="Arial, sans-serif" font-size="96" font-weight="900" letter-spacing="8">${safeInitials}</text>
  <text x="512" y="878" text-anchor="middle" fill="${foreground}" opacity=".72" font-family="Arial, sans-serif" font-size="38" font-weight="800">${safeLabel}</text>
</svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    alt: query || "Generated logo fallback",
    query,
    credit: "Local fallback logo",
    creditUrl: ""
  };
}

function fallbackImage(query, index) {
  return isLogoQuery(query) ? fallbackLogoImage(query, index) : fallbackWebsiteImage(query, index);
}

async function resolveGeminiImage(query, index) {
  const cacheKey = `${query}:${index}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    const image = await generateGeminiImage(query, index);
    if (image?.url) {
      imageCache.set(cacheKey, image);
      return image;
    }
  } catch (error) {
    console.warn("Gemini image generation crashed. Falling back to local placeholder.", error.message);
  }

  const image = fallbackImage(query, index);
  imageCache.set(cacheKey, image);
  return image;
}

async function resolveUnsplashImage(query, index) {
  const cacheKey = `${query}:${index}`;
  if (unsplashImageCache.has(cacheKey)) {
    return unsplashImageCache.get(cacheKey);
  }

  const image = await searchUnsplashImage(query, index);
  const resolvedImage = image?.url ? image : fallbackWebsiteImage(query, index);
  unsplashImageCache.set(cacheKey, resolvedImage);
  return resolvedImage;
}

function shouldUseGeminiImage(query, generatedCount, budgets) {
  const budget = isLogoQuery(query) ? budgets.logoImageBudget : budgets.graphicsImageBudget;
  return generatedCount.count < budget;
}

async function resolveBudgetedImage(query, index, generatedCount, budgets) {
  if (!shouldUseGeminiImage(query, generatedCount, budgets)) {
    return fallbackImage(query, index);
  }

  generatedCount.count += 1;
  return resolveGeminiImage(query, index);
}

function shouldRegenerateImage(image) {
  if (!image?.url) return true;
  const credit = image.credit?.toLowerCase() || "";
  return credit.includes("unsplash") || credit.startsWith("local fallback");
}

function keepExistingImage(image, query) {
  return image && !shouldRegenerateImage(image) ? { ...image, query } : undefined;
}

function shouldRegenerateWebsiteImage(image) {
  if (!image?.url) return true;
  const credit = image.credit?.toLowerCase() || "";
  return image.url.startsWith("data:image/") || credit.startsWith("local fallback") || credit.includes("gemini");
}

function keepExistingWebsiteImage(image, query) {
  return image && !shouldRegenerateWebsiteImage(image) ? { ...image, query } : undefined;
}

export async function resolveSectionImages(sections, prompt, options = {}) {
  const budgets = {
    graphicsImageBudget: options.graphicsImageBudget ?? options.websiteImageBudget ?? defaultLogoImageBudget,
    logoImageBudget: options.logoImageBudget ?? defaultLogoImageBudget
  };
  const graphicsOnly = options.graphicsOnly ?? false;
  const generatedCount = { count: 0 };
  const resolvedSections = [...sections];
  const sectionOrder = sections
    .map((section, index) => ({ section, index }))
    .sort((first, second) => (sectionPriority[first.section.type] ?? 99) - (sectionPriority[second.section.type] ?? 99));

  for (const { section, index } of sectionOrder) {
      const isGraphicsSection = section.type === "graphics";
      const query = section.image?.query || section.imageQuery || `${prompt} ${section.title || section.type || "website"}`;
      const items = Array.isArray(section.items)
        ? []
        : section.items;

      if (Array.isArray(section.items)) {
        for (const [itemIndex, item] of section.items.entries()) {
          if (!isGraphicsSection) {
            items.push(item);
            continue;
          }

          const itemQuery = item.image?.query || `${prompt} ${item.title || "business graphic"} generated visual`;
          const image = shouldRegenerateImage(item.image)
            ? await resolveBudgetedImage(itemQuery, index + itemIndex + 1, generatedCount, budgets)
            : { ...item.image, query: itemQuery };
          items.push({ ...item, image });
        }
      }

      if (graphicsOnly && !isGraphicsSection) {
        resolvedSections[index] = {
          ...section,
          items,
          image: keepExistingImage(section.image, query)
        };
        continue;
      }

      if (!isGraphicsSection && !renderImageSectionTypes.has(section.type)) {
        resolvedSections[index] = {
          ...section,
          items,
          image: keepExistingImage(section.image, query)
        };
        continue;
      }

      const existingImage = isGraphicsSection ? keepExistingImage(section.image, query) : keepExistingWebsiteImage(section.image, query);
      const image = existingImage || (isGraphicsSection && Array.isArray(items)
        ? items.find((item) => item?.image?.url)?.image
        : null) || (isGraphicsSection
          ? await resolveBudgetedImage(query, index, generatedCount, budgets)
          : await resolveUnsplashImage(query, index));

      resolvedSections[index] = {
        ...section,
        items,
        image
      };
  }

  return resolvedSections;
}
