import { supabaseAdmin } from "../services/supabaseAdmin.js";

function serializeProject(body, userId) {
  return {
    user_id: userId,
    name: body.name || "Untitled website",
    prompt: body.prompt || "",
    sections: Array.isArray(body.sections) ? body.sections : [],
    theme: body.theme && typeof body.theme === "object" ? body.theme : {}
  };
}

function serializeProjectUpdate(body) {
  const project = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) project.name = body.name || "Untitled website";
  if (Object.prototype.hasOwnProperty.call(body, "prompt")) project.prompt = body.prompt || "";
  if (Object.prototype.hasOwnProperty.call(body, "sections")) project.sections = Array.isArray(body.sections) ? body.sections : [];
  if (Object.prototype.hasOwnProperty.call(body, "theme")) project.theme = body.theme && typeof body.theme === "object" ? body.theme : {};

  return project;
}

export async function listProjects(req, res) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id,user_id,name,prompt,theme,created_at,updated_at")
    .eq("user_id", req.user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  res.json({ projects: data });
}

export async function getProject(req, res) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  if (error) {
    error.status = error.code === "PGRST116" ? 404 : 500;
    throw error;
  }

  res.json({ project: data });
}

export async function createProject(req, res) {
  const project = serializeProject(req.body, req.user.id);
  const { data, error } = await supabaseAdmin.from("projects").insert(project).select("*").single();

  if (error) throw error;
  res.status(201).json({ project: data });
}

export async function updateProject(req, res) {
  const project = {
    ...serializeProjectUpdate(req.body),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(project)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) throw error;
  res.json({ project: data });
}

export async function deleteProject(req, res) {
  const { error } = await supabaseAdmin.from("projects").delete().eq("id", req.params.id).eq("user_id", req.user.id);

  if (error) throw error;
  res.status(204).send();
}
