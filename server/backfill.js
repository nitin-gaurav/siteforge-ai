import { supabaseAdmin } from './src/services/supabaseAdmin.js';

async function run() {
  const { data: projects, error } = await supabaseAdmin.from('projects').select('id, sections, theme');
  if (error) throw error;

  for (const project of projects) {
    const sections = Array.isArray(project.sections) ? project.sections : [];
    const previewImage = sections.find((section) => section?.image?.url)?.image;
    
    const theme = project.theme && typeof project.theme === "object" ? project.theme : {};
    theme._meta = {
      section_count: sections.length,
      preview_image_url: previewImage?.url || "",
      preview_image_alt: previewImage?.alt || "",
      section_types: sections.map(s => ({ type: s.type || "", title: s.title || "" }))
    };

    await supabaseAdmin.from('projects').update({ theme }).eq('id', project.id);
    console.log(`Updated project ${project.id}`);
  }
  console.log('Done');
}
run();
