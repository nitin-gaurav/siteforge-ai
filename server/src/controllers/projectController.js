import { supabaseAdmin } from "../services/supabaseAdmin.js";

function serializeProject(body, userId) {
  const sections = Array.isArray(body.sections) ? body.sections : [];
  const previewImage = sections.find((section) => section?.image?.url)?.image;
  const theme = body.theme && typeof body.theme === "object" ? body.theme : {};
  theme._meta = {
    section_count: sections.length,
    preview_image_url: previewImage?.url || "",
    preview_image_alt: previewImage?.alt || "",
    section_types: sections.map(s => ({ type: s.type || "", title: s.title || "" }))
  };

  return {
    user_id: userId,
    name: body.name || "Untitled website",
    prompt: body.prompt || "",
    sections,
    theme
  };
}

function serializeProjectUpdate(body) {
  const project = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) project.name = body.name || "Untitled website";
  if (Object.prototype.hasOwnProperty.call(body, "prompt")) project.prompt = body.prompt || "";
  
  // We cannot reliably generate full _meta here without existing sections,
  // so we ONLY generate it if `sections` are being updated.
  if (Object.prototype.hasOwnProperty.call(body, "sections")) {
    const sections = Array.isArray(body.sections) ? body.sections : [];
    project.sections = sections;
    
    const previewImage = sections.find((section) => section?.image?.url)?.image;
    const theme = body.theme && typeof body.theme === "object" ? body.theme : {};
    
    // We assume frontend handles preserving theme properties, we just augment it
    theme._meta = {
      section_count: sections.length,
      preview_image_url: previewImage?.url || "",
      preview_image_alt: previewImage?.alt || "",
      section_types: sections.map(s => ({ type: s.type || "", title: s.title || "" }))
    };
    project.theme = theme;
  } else if (Object.prototype.hasOwnProperty.call(body, "theme")) {
    // If frontend sends a theme update without sections, we accept it.
    // The frontend should ensure it doesn't drop `_meta`, but we can't fetch it here safely.
    project.theme = body.theme && typeof body.theme === "object" ? body.theme : {};
  }

  return project;
}

function summarizeProject(project) {
  const meta = project.theme?._meta || {};

  return {
    id: project.id,
    user_id: project.user_id,
    name: project.name,
    prompt: project.prompt,
    theme: project.theme,
    created_at: project.created_at,
    updated_at: project.updated_at,
    section_count: meta.section_count || 0,
    preview_image_url: meta.preview_image_url || "",
    preview_image_alt: meta.preview_image_alt || "",
    sections: meta.section_types || []
  };
}

export async function listProjects(req, res) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id,user_id,name,prompt,theme,created_at,updated_at")
    .eq("user_id", req.user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  res.json({ projects: (data || []).map(summarizeProject) });
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
