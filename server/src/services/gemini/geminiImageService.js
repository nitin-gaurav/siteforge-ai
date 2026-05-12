import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

config();
config({ path: resolve(__dirname, "../../../.env"), override: false });

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const imageCache = new Map();

function imageModelCandidates() {
  return [...new Set([
    process.env.GEMINI_IMAGE_MODEL,
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.0-flash-exp-image-generation"
  ].filter(Boolean))];
}

function buildImagePrompt(query = "") {
  return [
    "Create one polished, production-ready marketing image.",
    "Use the following business visual brief as the subject.",
    `Brief: ${query}`,
    "Style: clean commercial design, realistic lighting where appropriate, no readable text, no watermarks, no logos unless explicitly named in the brief.",
    "Composition: suitable for a website card or banner, clear focal point, professional color and contrast."
  ].join("\n");
}

function extractInlineImage(payload) {
  const parts = payload?.candidates?.flatMap((candidate) => candidate?.content?.parts || []) || [];
  return parts.find((part) => part?.inlineData?.data);
}

export async function generateGeminiImage(query, index = 0) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const cacheKey = `${query}:${index}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const errors = [];

  for (const modelName of imageModelCandidates()) {
    const url = new URL(`${GEMINI_API_URL}/${modelName}:generateContent`);
    url.searchParams.set("key", process.env.GEMINI_API_KEY);

    try {
      const response = await fetch(url, {
        method: "POST",
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
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        errors.push(`${modelName}: ${payload?.error?.message || response.statusText}`);
        continue;
      }

      const imagePart = extractInlineImage(payload);
      const imageData = imagePart?.inlineData?.data;
      const mimeType = imagePart?.inlineData?.mimeType || "image/png";

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
      errors.push(`${modelName}: ${error.message}`);
    }
  }

  console.warn("Gemini image generation failed. Falling back to stock image search.", errors);
  return null;
}
