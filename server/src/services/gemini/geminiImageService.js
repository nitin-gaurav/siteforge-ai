import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

config();
config({ path: resolve(__dirname, "../../../.env"), override: false });

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_IMAGE_TIMEOUT_MS = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 25000);
const imageCache = new Map();

let cachedFetch;

async function resolveFetch() {
  if (typeof fetch === "function") return fetch;
  if (cachedFetch) return cachedFetch;

  const mod = await import("node-fetch");
  cachedFetch = mod.default || mod;
  return cachedFetch;
}

function imageModelCandidates() {
  return [...new Set([
    "gemini-2.5-flash-image",
    process.env.GEMINI_IMAGE_MODEL,
    "gemini-3-pro-image-preview"
  ]
    .filter(Boolean)
    .filter((modelName) => modelName !== process.env.GEMINI_MODEL))];
}

function buildImagePrompt(query = "") {
  const lowerQuery = query.toLowerCase();
  const isLogo = lowerQuery.includes("logo") || lowerQuery.includes("app icon") || lowerQuery.includes("brand mark");

  if (isLogo) {
    return [
      "Create one square, export-ready logo concept.",
      "Use the following brand brief as the subject.",
      `Brief: ${query}`,
      "Style: clean brand identity design, centered composition, simple memorable mark, high contrast, flat or lightly dimensional.",
      "Do not create a website banner, poster, mockup scene, storefront, social post, or photo-real lifestyle image.",
      "Avoid long readable text. If text is necessary, use only a short brand-name treatment from the brief.",
      "Composition: square canvas, generous padding, suitable for app icons, favicons, and logo export."
    ].join("\n");
  }

  return [
    "Create one polished, production-ready marketing image.",
    "Use the following business visual brief as the subject.",
    `Brief: ${query}`,
    "Style: clean commercial design, realistic lighting where appropriate, no readable text, no watermarks, no logos unless explicitly named in the brief.",
    "Composition: suitable for a website card or banner, clear focal point, professional color and contrast."
  ].join("\n");
}

function collectParts(payload) {
  if (Array.isArray(payload?.candidates)) {
    return payload.candidates.flatMap((candidate) => candidate?.content?.parts || []);
  }

  if (Array.isArray(payload?.response?.candidates)) {
    return payload.response.candidates.flatMap((candidate) => candidate?.content?.parts || []);
  }

  if (Array.isArray(payload?.parts)) return payload.parts;
  if (Array.isArray(payload?.response?.parts)) return payload.response.parts;
  return [];
}

function extractInlineImage(payload) {
  const parts = collectParts(payload);
  return parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
}

export async function generateGeminiImage(query, index = 0) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const fetchFn = await resolveFetch();

  const cacheKey = `${query}:${index}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const errors = [];

  for (const modelName of imageModelCandidates()) {
    const url = new URL(`${GEMINI_API_URL}/${modelName}:generateContent`);
    url.searchParams.set("key", process.env.GEMINI_API_KEY);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_IMAGE_TIMEOUT_MS);

    try {
      const response = await fetchFn(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildImagePrompt(query)
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["Image"]
          }
        })
      });
      clearTimeout(timeout);

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        errors.push(`${modelName}: ${payload?.error?.message || response.statusText}`);
        continue;
      }

      const imagePart = extractInlineImage(payload);
      const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
      const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";

      if (!imageData) {
        errors.push(`${modelName}: no image returned`);
        continue;
      }

      const image = {
        url: `data:${mimeType};base64,${imageData}`,
        alt: query || "AI-generated business image",
        query,
        credit: "Generated with Gemini",
        creditUrl: "https://ai.google.dev/gemini-api/docs/image-generation"
      };

      imageCache.set(cacheKey, image);
      return image;
    } catch (error) {
      errors.push(`${modelName}: ${error.name === "AbortError" ? "request timed out" : error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  console.warn("Gemini image generation failed. Falling back to stock image search.", errors);
  return null;
}
