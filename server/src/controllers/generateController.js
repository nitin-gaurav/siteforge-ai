import { generateWebsite } from "../services/gemini/geminiService.js";
import { resolveSectionImages } from "../services/gemini/geminiImageResolver.js";

export async function generateSite(req, res) {
  const prompt = req.body.prompt?.trim();

  if (!prompt) {
    const error = new Error("Prompt is required");
    error.status = 400;
    throw error;
  }

  const website = await generateWebsite(prompt, {
    includeImages: req.body.includeImages !== false
  });
  res.json(website);
}

export async function generateImages(req, res) {
  const prompt = req.body.prompt?.trim();
  const sections = Array.isArray(req.body.sections) ? req.body.sections : [];
  const options = req.body.options && typeof req.body.options === "object" ? req.body.options : {};

  if (!prompt) {
    const error = new Error("Prompt is required");
    error.status = 400;
    throw error;
  }

  if (!sections.length) {
    const error = new Error("Sections are required");
    error.status = 400;
    throw error;
  }

  const resolvedSections = await resolveSectionImages(sections, prompt, {
    websiteImageBudget: Number(options.websiteImageBudget ?? 3),
    logoImageBudget: Number(options.logoImageBudget ?? 3),
    graphicsOnly: options.graphicsOnly ?? false
  });
  res.json({ sections: resolvedSections });
}
