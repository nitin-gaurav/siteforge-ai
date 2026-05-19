const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";
const UNSPLASH_RESULTS_PER_PAGE = 30;
const imageCache = new Map();

let cachedFetch;

async function resolveFetch() {
  if (typeof fetch === "function") return fetch;
  if (cachedFetch) return cachedFetch;

  const mod = await import("node-fetch");
  cachedFetch = mod.default || mod;
  return cachedFetch;
}

function normalizeQuery(query = "") {
  return (query || "business website")
    .replace(/\b(generate|create|make|build|website|image|photo|picture|banner|graphic)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90) || "business website";
}

export async function searchUnsplashImage(query, index = 0) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY;
  if (!accessKey) return null;

  const normalizedQuery = normalizeQuery(query);
  const cacheKey = `${normalizedQuery}:${index}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  const fetchFn = await resolveFetch();
  const url = new URL(UNSPLASH_API_URL);
  const page = Math.floor(index / UNSPLASH_RESULTS_PER_PAGE) + 1;
  url.searchParams.set("query", normalizedQuery);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", String(UNSPLASH_RESULTS_PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("client_id", accessKey);

  try {
    const response = await fetchFn(url);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return null;
    }

    const results = Array.isArray(payload.results) ? payload.results : [];
    const photo = results[index % UNSPLASH_RESULTS_PER_PAGE] || results[0];
    if (!photo?.urls) return null;

    const image = {
      url: `${photo.urls.regular}${photo.urls.regular.includes("?") ? "&" : "?"}auto=format&fit=crop&w=1400&q=80`,
      alt: photo.alt_description || photo.description || normalizedQuery,
      query: normalizedQuery,
      credit: `Unsplash / ${photo.user?.name || "Photographer"}`,
      creditUrl: photo.links?.html || "https://unsplash.com"
    };

    imageCache.set(cacheKey, image);
    return image;
  } catch {
    return null;
  }
}
