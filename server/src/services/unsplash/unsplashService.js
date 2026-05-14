const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";
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
  url.searchParams.set("query", normalizedQuery);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "12");
  url.searchParams.set("client_id", accessKey);

  try {
    const response = await fetchFn(url);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn("Unsplash image search failed.", payload?.errors || payload?.error || response.statusText);
      return null;
    }

    const results = Array.isArray(payload.results) ? payload.results : [];
    const photo = results[index % Math.max(results.length, 1)];
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
  } catch (error) {
    console.warn("Unsplash image search crashed.", error.message);
    return null;
  }
}
