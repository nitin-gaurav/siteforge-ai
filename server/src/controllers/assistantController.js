import { assistWebsiteEdit } from "../services/gemini/geminiService.js";

export async function assistSite(req, res) {
  const instruction = req.body.instruction?.trim();
  const project = req.body.project;

  if (!instruction) {
    const error = new Error("Instruction is required");
    error.status = 400;
    throw error;
  }

  if (!project || typeof project !== "object") {
    const error = new Error("Project JSON is required");
    error.status = 400;
    throw error;
  }

  const result = await assistWebsiteEdit(project, instruction);
  res.json(result);
}
