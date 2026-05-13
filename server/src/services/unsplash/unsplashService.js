import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { generateGeminiImage } from "../gemini/geminiImageService.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

config();
config({ path: resolve(__dirname, "../../../.env"), override: false });

const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";
const imageCache = new Map();
const curatedFallbacks = {
  coffee: [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=80"
  ],
  food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80"
  ],
  automotive: [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80"
  ],
  business: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80"
  ],
  default: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
  ]
};

function normalizeSearchQuery(query = "") {
  return query
    .replace(/\bcofeee\b/gi, "coffee")
    .replace(/\bautomobike\b/gi, "automotive")
    .replace(/\bgenrate\b/gi, "generate")
    .replace(/\bgerneret\b/gi, "generate")
    .replace(/\bgenerated?\b/gi, " ")
    .replace(/\bwebsite\b/gi, " ")
    .replace(/\bimages?\b/gi, " ")
    .replace(/\bgraphics?\b/gi, " ")
    .replace(/\bbanners?\b/gi, " ")
    .replace(/\bbrand(?:ed)?\b/gi, " ")
    .replace(/\brelevant\b|\bbusiness\b|\bidea\b/gi, " ")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryAlternates(query = "") {
  const cleaned = normalizeSearchQuery(query);
  const fallback = cleaned || query || "business";
  const alternates = [
    query,
    cleaned,
    fallback.includes("automotive") || fallback.includes("automobile") || fallback.includes("vehicle") || fallback.includes("dealership") || /\bcars?\b/.test(fallback)
      ? "modern car dealership showroom vehicles"
      : "",
    `${fallback} lifestyle`,
    `${fallback} interior`,
    `${fallback} product`,
    fallback.includes("coffee") || fallback.includes("cafe") ? "cozy coffee shop cafe interior latte" : `${fallback} business`
  ];

  return [...new Set(alternates.map((item) => item.trim()).filter(Boolean))];
}

function fallbackImage(query, index) {
  const normalized = normalizeSearchQuery(query);
  const fallbackGroup = normalized.includes("coffee") || normalized.includes("cafe")
    ? "coffee"
    : normalized.includes("restaurant") || normalized.includes("food") || normalized.includes("bakery")
    ? "food"
    : normalized.includes("automotive") || normalized.includes("automobile") || normalized.includes("vehicle") || normalized.includes("dealership") || /\bcars?\b/.test(normalized)
    ? "automotive"
    : normalized.includes("office") || normalized.includes("startup") || normalized.includes("business")
    ? "business"
    : "default";
  const fallbackUrls = curatedFallbacks[fallbackGroup];
  const url = fallbackUrls[index % fallbackUrls.length];

  if (url) {
    return {
      url,
      alt: query || `${fallbackGroup} website image`,
      query,
      credit: "Curated fallback photo from Unsplash",
      creditUrl: "https://unsplash.com"
    };
  }

  const label = (query || "Generated website image")
    .replace(/[<>&"]/g, "")
    .slice(0, 72);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#111827"/>
      <stop offset="1" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="900" fill="url(#g)"/>
  <circle cx="1130" cy="180" r="180" fill="#7c3aed" opacity=".35"/>
  <circle cx="240" cy="720" r="220" fill="#ef4444" opacity=".22"/>
  <text x="80" y="430" fill="#ffffff" font-family="Arial, sans-serif" font-size="54" font-weight="800">Image preview</text>
  <text x="80" y="505" fill="#dbeafe" font-family="Arial, sans-serif" font-size="34">${label}</text>
</svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    alt: query || "Generated website image",
    query,
    credit: "Placeholder image",
    creditUrl: ""
  };
}

function isLogoQuery(query = "") {
  const normalized = query.toLowerCase();
  return normalized.includes("logo") || normalized.includes("app icon") || normalized.includes("brand mark");
}

function logoPlaceholderImage(query = "", index = 0) {
  const label = normalizeSearchQuery(query)
    .replace(/\b(square|clean|brand|identity|mark|icon|logo|symbol|simple|centered|text|vector|style|minimal|mockup|banner)\b/gi, " ")
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
    alt: query || "Generated logo placeholder",
    query,
    credit: "Generated logo placeholder",
    creditUrl: ""
  };
}

export async function searchUnsplashImage(query, index = 0) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return fallbackImage(query, index);
  }

  const cacheKey = `${query}:${index}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  for (const searchQuery of queryAlternates(query)) {
    const url = new URL(UNSPLASH_API_URL);
    url.searchParams.set("query", searchQuery || "website");
    url.searchParams.set("per_page", "12");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    let data;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1"
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.warn("Unsplash search failed", response.status, errorText);
        if ([401, 403, 429].includes(response.status)) break;
        continue;
      }

      data = await response.json();
    } catch (error) {
      console.warn("Unsplash search request failed", error.message);
      continue;
    }

    const results = Array.isArray(data.results) ? data.results : [];
    const photo = results[index % Math.max(results.length, 1)];

    if (!photo) {
      continue;
    }

    const image = {
      url: photo.urls?.regular || photo.urls?.full || fallbackImage(query, index).url,
      alt: photo.alt_description || photo.description || searchQuery || query || "Unsplash image",
      query: searchQuery,
      credit: photo.user?.name ? `Photo by ${photo.user.name} on Unsplash` : "Photo from Unsplash",
      creditUrl: photo.links?.html || ""
    };
    imageCache.set(cacheKey, image);
    return image;
  }

  const image = fallbackImage(query, index);
  imageCache.set(cacheKey, image);
  return image;
}

async function resolveGraphicImage(query, index) {
  if (isLogoQuery(query) && index > 1) {
    return logoPlaceholderImage(query, index);
  }

  try {
    const generatedImage = await generateGeminiImage(query, index);
    if (generatedImage) return generatedImage;
  } catch (error) {
    console.warn("Gemini image generation crashed. Falling back to stock or placeholder image.", error.message);
  }

  const stockImage = await searchUnsplashImage(query, index);
  if (stockImage?.url) return stockImage;
  if (isLogoQuery(query)) return logoPlaceholderImage(query, index);
  return stockImage;
}

export async function resolveSectionImages(sections, prompt) {
  return Promise.all(
    sections.map(async (section, index) => {
      const isGraphicsSection = section.type === "graphics";
      const query = section.image?.query || section.imageQuery || `${prompt} ${section.title || section.type || "website"}`;
      const items = Array.isArray(section.items)
        ? await Promise.all(
            section.items.map(async (item, itemIndex) => {
              if (!isGraphicsSection) return item;
              const itemQuery = item.image?.query || `${prompt} ${item.title || "business graphic"} banner graphic`;
              const image = item.image?.url ? { ...item.image, query: itemQuery } : await resolveGraphicImage(itemQuery, index + itemIndex + 1);
              return { ...item, image };
            })
          )
        : section.items;

      if (isGraphicsSection) {
        const firstGeneratedImage = Array.isArray(items)
          ? items.find((item) => item?.image?.url)?.image
          : null;

        if (section.image?.url && !section.image.url.includes("placehold.co")) {
          return {
            ...section,
            items,
            image: {
              ...section.image,
              query
            }
          };
        }

        return {
          ...section,
          items,
          image: firstGeneratedImage || await resolveGraphicImage(query, index)
        };
      }

      if (section.image?.url && !section.image.url.includes("placehold.co")) {
        return {
          ...section,
          items,
          image: {
            ...section.image,
            query
          }
        };
      }

      return {
        ...section,
        items,
        image: await searchUnsplashImage(query, index)
      };
    })
  );
}
