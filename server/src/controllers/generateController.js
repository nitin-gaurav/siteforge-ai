import { generateWebsite } from "../services/gemini/geminiService.js";

export async function generateSite(req, res) {
  const prompt = req.body.prompt?.trim();

  if (!prompt) {
    const error = new Error("Prompt is required");
    error.status = 400;
    throw error;
  }

  const website = await generateWebsite(prompt);
  res.json(website);
}
