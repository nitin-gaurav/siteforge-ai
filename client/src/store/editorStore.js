import { create } from "zustand";
import { createId } from "../utils/id.js";

const starterSections = [
  {
    id: createId(),
    type: "hero",
    title: "Launch a polished site in minutes",
    body: "Describe the product, audience, and tone. The builder turns it into an editable page.",
    cta: "Start building",
    image: {
      url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
      alt: "Modern workspace for building a website",
      query: "modern workspace"
    }
  },
  {
    id: createId(),
    type: "features",
    title: "Everything stays editable",
    body: "Generate sections, tune content, rearrange blocks, and save the project to Supabase.",
    image: {
      url: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80",
      alt: "Team reviewing website sections",
      query: "website builder dashboard"
    }
  }
];

export const useEditorStore = create((set) => ({
  projectId: null,
  name: "Untitled website",
  prompt: "",
  sections: starterSections,
  theme: {
    primary: "#2f6fed",
    background: "#ffffff",
    text: "#101418"
  },
  status: "idle",
  resetProject: () =>
    set({
      projectId: null,
      name: "Untitled website",
      prompt: "",
      sections: starterSections,
      theme: {
        primary: "#2f6fed",
        background: "#ffffff",
        text: "#101418"
      },
      status: "idle"
    }),
  startProjectLoad: (projectId) =>
    set({
      projectId,
      name: "Loading project...",
      prompt: "",
      sections: [],
      theme: {
        primary: "#2f6fed",
        background: "#ffffff",
        text: "#101418"
      },
      status: "loading"
    }),
  setProject: (project) =>
    set({
      projectId: project?.id ?? null,
      name: project?.name ?? "Untitled website",
      prompt: project?.prompt ?? "",
      sections: project?.sections?.length ? project.sections : starterSections,
      theme: {
        primary: "#2f6fed",
        background: "#ffffff",
        text: "#101418",
        ...(project?.theme ?? {})
      },
      status: "idle"
    }),
  setPrompt: (prompt) => set({ prompt }),
  setName: (name) => set({ name }),
  setTheme: (theme) => set((state) => ({ theme: { ...state.theme, ...theme } })),
  setSections: (sections) => set({ sections }),
  reorderSections: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.sections.length || toIndex >= state.sections.length) {
        return state;
      }

      const sections = [...state.sections];
      const [movedSection] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, movedSection);
      return { sections };
    }),
  updateSection: (id, patch) =>
    set((state) => ({
      sections: state.sections.map((section) => (section.id === id ? { ...section, ...patch } : section))
    })),
  addSection: (type) =>
    set((state) => ({
      sections: [
        ...state.sections,
        {
          id: createId(),
          type,
          title: type === "testimonial" ? "Customers move faster" : type === "sidebar" ? "Explore by Category" : type === "graphics" ? "AI Image Generation" : type === "about" ? "About the business" : type === "services" ? "Our services" : type === "faq" ? "Frequently asked questions" : "New section",
          body: type === "sidebar" ? "Help visitors jump between key categories, pages, or filters." : type === "graphics" ? "Generate images and banner graphics relevant to this business." : type === "about" ? "Explain who the business serves and why customers choose it." : type === "services" ? "Show the main services customers can choose from." : type === "faq" ? "Answer common customer questions." : "Add focused copy for this part of the page.",
          cta: type === "cta" ? "Book a demo" : "",
          image: {
            url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
            alt: "Section image",
            query: "website section"
          },
          items: type === "sidebar"
            ? [
                { title: "Overview", body: "Start with the main story and key highlights." },
                { title: "Categories", body: "Group content into clear paths for faster browsing." },
                { title: "Featured Picks", body: "Surface the most important pages or recommendations." }
              ]
            : type === "graphics"
            ? [
                { title: "Business banner visual", body: "A visual tailored to the business and audience.", meta: "Banner" },
                { title: "Offer artwork", body: "A graphic for the main product, service, or experience.", meta: "Offer" },
                { title: "Promo graphic", body: "A promotional visual for posts and campaigns.", meta: "Promo" }
              ]
            : type === "services"
            ? [
                { title: "Core Service", body: "Describe the main offer.", meta: "01" },
                { title: "Customer Support", body: "Describe support or consultation.", meta: "02" },
                { title: "Custom Solutions", body: "Describe tailored options.", meta: "03" }
              ]
            : type === "faq"
            ? [
                { title: "How do I get started?", body: "Explain the first step.", meta: "FAQ" },
                { title: "Who is this for?", body: "Explain the ideal customer.", meta: "FAQ" },
                { title: "Can I request something custom?", body: "Explain customization options.", meta: "FAQ" }
              ]
            : []
        }
      ]
    })),
  removeSection: (id) => set((state) => ({ sections: state.sections.filter((section) => section.id !== id) })),
  setStatus: (status) => set({ status })
}));
