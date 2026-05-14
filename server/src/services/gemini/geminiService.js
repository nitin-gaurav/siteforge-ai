import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { resolveSectionImages } from "./geminiImageResolver.js";

const GEMINI_TEXT_TIMEOUT_MS = Number(process.env.GEMINI_TEXT_TIMEOUT_MS || 12000);
const GEMINI_ASSISTANT_TIMEOUT_MS = Number(process.env.GEMINI_ASSISTANT_TIMEOUT_MS || 10000);

function withTimeout(promise, timeoutMs, label) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function promptKind(prompt = "") {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes("sidebar") || lowerPrompt.includes("side bar")) return "sidebar";
  if (lowerPrompt.includes("anime") || lowerPrompt.includes("manga")) return "anime";
  if (lowerPrompt.includes("coffee") || lowerPrompt.includes("cafe")) return "coffee";
  if (
    lowerPrompt.includes("automobile") ||
    lowerPrompt.includes("automotive") ||
    lowerPrompt.includes("automobike") ||
    /\bcars?\b/.test(lowerPrompt) ||
    lowerPrompt.includes("vehicle") ||
    lowerPrompt.includes("auto dealer") ||
    lowerPrompt.includes("dealership")
  ) return "automotive";
  if (lowerPrompt.includes("motorcycle") || lowerPrompt.includes("bike")) return "motorcycle";
  return "default";
}

function promptField(prompt = "", label = "") {
  const pattern = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
  return prompt.match(pattern)?.[1]?.trim() || "";
}

function businessSubject(prompt = "") {
  const namedBusiness = promptField(prompt, "Business name");
  const industry = promptField(prompt, "Category/industry") || promptField(prompt, "Industry");
  const source = namedBusiness || industry || prompt.split("\n").find((line) => line.trim()) || prompt;

  return source
    .replace(/\b(generate|create|make|build|website|images?|graphics?|banner|banners|for|a|an|the|only|relevant|business|brief|small|category|industry|target|audience|tone|style)\b/gi, " ")
    .replace(/[^a-z0-9&\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48) || "Business";
}

function titleCase(text) {
  return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function normalizeImage(section, prompt) {
  const image = section.image && typeof section.image === "object" ? section.image : {};
  const query = image.query || section.imageQuery || `${prompt} ${section.type || "website"}`;

  return {
    url: image.url || "",
    alt: image.alt || section.title || "Website section image",
    query
  };
}

async function withImages(website, prompt, options = {}) {
  return {
    ...website,
    sections: await resolveSectionImages(website.sections, prompt, options)
  };
}

function fallbackWebsiteDraft(prompt) {
  const subject = titleCase(businessSubject(prompt));

  if (promptKind(prompt) === "sidebar") {
    return {
      name: "Sidebar Update",
      theme: {
        primary: "#2f6fed",
        background: "#ffffff",
        text: "#101418"
      },
      sections: [
        {
          id: randomUUID(),
          type: "sidebar",
          title: "Explore by Category",
          body: "A compact sidebar helps visitors jump between the most important parts of the website.",
          cta: "",
          image: normalizeImage({ type: "sidebar", title: "Sidebar navigation", image: { query: `${prompt} website navigation sidebar` } }, prompt),
          items: [
            { title: "Overview", body: "Start with the main story and key highlights." },
            { title: "Categories", body: "Group content into clear paths for faster browsing." },
            { title: "Featured Picks", body: "Surface the most important pages or recommendations." },
            { title: "Contact", body: "Give visitors a direct next step." }
          ]
        }
      ]
    };
  }

  if (promptKind(prompt) === "anime") {
    return {
      name: "Anime Rank Arena",
      theme: {
        primary: "#ef4444",
        background: "#111322",
        text: "#f8fafc"
      },
      sections: [
        {
          id: randomUUID(),
          type: "hero",
          title: "This Month's Anime Power Rankings",
          body: "Track the hottest shows, biggest fandom shifts, and fight-scene moments dominating the community this month.",
          cta: "View Rankings",
          image: normalizeImage({ type: "hero", title: "Anime ranking hero", image: { query: "anime cosplay neon ranking" } }, prompt)
        },
        {
          id: randomUUID(),
          type: "features",
          title: "Top Anime This Month",
          body: "A ranked board built for fans who want quick picks, sharp notes, and weekly movement.",
          cta: "",
          image: normalizeImage({ type: "features", title: "Anime ranking board", image: { query: "manga anime poster collection" } }, prompt),
          items: [
            {
              title: "#1 Solo Leveling",
              body: "Dominates action buzz with clean pacing, intense fights, and huge weekly discussion."
            },
            {
              title: "#2 Frieren",
              body: "A quieter fantasy favorite with emotional storytelling and lasting fan momentum."
            },
            {
              title: "#3 Jujutsu Kaisen",
              body: "Still a battle-shonen staple thanks to explosive choreography and character stakes."
            }
          ]
        },
        {
          id: randomUUID(),
          type: "features",
          title: "Fighting Scene Body Animation",
          body: "Highlight battle choreography with animated motion cards, impact beats, and frame-by-frame notes.",
          cta: "",
          image: normalizeImage({ type: "features", title: "Anime battle animation", image: { query: "anime action illustration" } }, prompt),
          items: [
            {
              title: "Impact Frames",
              body: "Call out freeze-frame smears, hit sparks, and dramatic pose transitions."
            },
            {
              title: "Motion Flow",
              body: "Show how the fighter's body movement carries force through each exchange."
            },
            {
              title: "Scene Rating",
              body: "Score animation clarity, camera movement, and emotional payoff."
            }
          ]
        },
        {
          id: randomUUID(),
          type: "cta",
          title: "Vote For Next Month's Ranking",
          body: "Let fans submit their favorite episodes, fights, and character moments for the next leaderboard.",
          cta: "Submit Your Vote",
          image: normalizeImage({ type: "cta", title: "Anime community voting", image: { query: "anime convention fans" } }, prompt)
        }
      ]
    };
  }

  if (promptKind(prompt) === "automotive") {
    return {
      name: subject && subject !== "Business" ? subject : "Automotive Website",
      theme: {
        primary: "#2563eb",
        background: "#f8fafc",
        text: "#0f172a"
      },
      sections: [
        {
          id: randomUUID(),
          type: "hero",
          title: `${subject} for drivers ready to move`,
          body: "Discover reliable vehicles, transparent guidance, and a smoother path from browsing to booking a test drive.",
          cta: "Browse cars",
          image: normalizeImage({ type: "hero", title: "Car showroom hero", image: { query: `${prompt} modern car showroom luxury vehicles dealership` } }, prompt)
        },
        {
          id: randomUUID(),
          type: "about",
          title: "A better way to choose your next car",
          body: "A customer-first automotive experience built around clear listings, helpful advice, and confidence at every step.",
          cta: "",
          image: normalizeImage({ type: "about", title: "Automotive sales consultation", image: { query: `${prompt} car dealership customer consultation` } }, prompt)
        },
        {
          id: randomUUID(),
          type: "services",
          title: "Automotive services",
          body: "Help visitors quickly understand how the business supports car discovery, purchase decisions, and ownership needs.",
          cta: "",
          image: normalizeImage({ type: "services", title: "Automotive services", image: { query: `${prompt} auto service car dealership vehicles` } }, prompt),
          items: [
            { title: "Vehicle Sales", body: "Browse a focused selection of cars with clear details and practical buying support.", meta: "01" },
            { title: "Test Drives", body: "Schedule a convenient test drive and compare options with expert guidance.", meta: "02" },
            { title: "Financing Support", body: "Explore flexible payment paths and get help choosing an option that fits.", meta: "03" }
          ]
        },
        {
          id: randomUUID(),
          type: "features",
          title: "Featured inventory highlights",
          body: "Showcase the vehicles, categories, and benefits that matter most to the target audience.",
          cta: "",
          image: normalizeImage({ type: "features", title: "Featured cars", image: { query: `${prompt} featured cars dealership lot` } }, prompt),
          items: [
            { title: "Sedans and City Cars", body: "Efficient options for daily drives, business travel, and family routines.", meta: "Popular" },
            { title: "SUVs and Crossovers", body: "Spacious vehicles for comfort, flexibility, and weekend plans.", meta: "Family" },
            { title: "Premium Models", body: "Refined vehicles for buyers who want design, performance, and presence.", meta: "Premium" }
          ]
        },
        {
          id: randomUUID(),
          type: "faq",
          title: "Frequently asked questions",
          body: "Answer the questions car shoppers usually ask before they visit, call, or book a test drive.",
          cta: "",
          image: normalizeImage({ type: "faq", title: "Car buyer questions", image: { query: `${prompt} car buyer customer questions dealership` } }, prompt),
          items: [
            { title: "Can I book a test drive?", body: "Yes, visitors can request a test drive for available vehicles.", meta: "FAQ" },
            { title: "Do you help with financing?", body: "Yes, financing guidance can be offered based on customer needs.", meta: "FAQ" },
            { title: "Can I compare different models?", body: "Yes, customers can compare vehicle categories, features, and budgets.", meta: "FAQ" }
          ]
        },
        {
          id: randomUUID(),
          type: "testimonial",
          title: "Trusted by drivers",
          body: "The team made it easy to compare cars, understand the options, and choose a vehicle with confidence.",
          cta: "",
          image: normalizeImage({ type: "testimonial", title: "Happy car buyer", image: { query: `${prompt} happy customer car dealership` } }, prompt)
        },
        {
          id: randomUUID(),
          type: "contact",
          title: "Visit the showroom",
          body: "Make it easy for visitors to call, ask about inventory, or schedule a test drive.",
          cta: "Schedule a test drive",
          image: normalizeImage({ type: "contact", title: "Car showroom contact", image: { query: `${prompt} car dealership showroom contact` } }, prompt),
          items: [
            { title: "Sales phone", body: "Add the main sales number for vehicle inquiries.", meta: "Call" },
            { title: "Showroom address", body: "Add the dealership location or service area.", meta: "Visit" },
            { title: "Business hours", body: "Add showroom hours and test-drive availability.", meta: "Hours" }
          ]
        },
        {
          id: randomUUID(),
          type: "seo",
          title: "SEO content",
          body: "Search-friendly automotive copy for car buyers looking for trusted vehicles, showroom support, and test drives.",
          cta: "",
          image: normalizeImage({ type: "seo", title: "Automotive SEO", image: { query: `${prompt} automotive search marketing car dealership` } }, prompt),
          items: [
            { title: "Suggested page title", body: `${subject} | Cars, Test Drives, and Automotive Support`, meta: "Title" },
            { title: "Meta description", body: "Find reliable cars, compare options, and book a test drive with a customer-focused automotive team.", meta: "Meta" },
            { title: "Keyword focus", body: "cars, automotive, dealership, test drive, vehicle sales", meta: "SEO" }
          ]
        },
        {
          id: randomUUID(),
          type: "cta",
          title: "Ready to find your next car?",
          body: "Explore available vehicles and take the next step with clear guidance from the team.",
          cta: "Book a test drive",
          image: normalizeImage({ type: "cta", title: "Book a car test drive", image: { query: `${prompt} car test drive keys dealership` } }, prompt)
        }
      ]
    };
  }

  return {
    name: subject && subject !== "Business" ? subject : "Generated website",
    theme: {
      primary: "#2f6fed",
      background: "#ffffff",
      text: "#101418"
    },
    sections: [
      {
        id: randomUUID(),
        type: "hero",
        title: `${subject} built for your next customer`,
        body: "A focused landing page shaped around the business, audience, services, and next step.",
        cta: "Get started",
        image: normalizeImage({ type: "hero", title: "Website hero", image: { query: `${prompt} hero` } }, prompt)
      },
      {
        id: randomUUID(),
        type: "about",
        title: "About the business",
        body: "A clear introduction that explains who the business serves, what it offers, and why visitors should trust it.",
        cta: "",
        image: normalizeImage({ type: "about", title: "About the business", image: { query: `${prompt} about business` } }, prompt)
      },
      {
        id: randomUUID(),
        type: "services",
        title: "Services designed for customers",
        body: "A focused services section that turns the business idea into clear offers visitors can understand quickly.",
        cta: "",
        image: normalizeImage({ type: "services", title: "Business services", image: { query: `${prompt} services` } }, prompt),
        items: [
          { title: "Core Service", body: "The main service or offer customers come for.", meta: "01" },
          { title: "Customer Support", body: "Helpful guidance before, during, and after the purchase.", meta: "02" },
          { title: "Custom Solutions", body: "Flexible options tailored to each customer need.", meta: "03" }
        ]
      },
      {
        id: randomUUID(),
        type: "faq",
        title: "Frequently asked questions",
        body: "Answers to common customer questions before they take the next step.",
        cta: "",
        image: normalizeImage({ type: "faq", title: "Customer questions", image: { query: `${prompt} customer support questions` } }, prompt),
        items: [
          { title: "How do I get started?", body: "Contact the business or use the call-to-action to begin.", meta: "FAQ" },
          { title: "Who is this for?", body: "Customers who need a clear, reliable solution in this category.", meta: "FAQ" },
          { title: "Can I request something custom?", body: "Yes, the offer can be adapted to specific customer needs.", meta: "FAQ" }
        ]
      },
      {
        id: randomUUID(),
        type: "testimonial",
        title: "Trusted by local customers",
        body: "A reliable choice for customers who want clear communication, thoughtful service, and results they can feel confident about.",
        cta: "",
        image: normalizeImage({ type: "testimonial", title: "Happy customer testimonial", image: { query: `${prompt} happy customer testimonial` } }, prompt)
      },
      {
        id: randomUUID(),
        type: "contact",
        title: "Contact information",
        body: "Make it easy for visitors to reach out, ask questions, or book the next step.",
        cta: "Get in touch",
        image: normalizeImage({ type: "contact", title: "Contact the business", image: { query: `${prompt} customer contact support` } }, prompt),
        items: [
          { title: "Phone", body: "Add the best phone number for customer inquiries.", meta: "Call" },
          { title: "Email", body: "Add the primary email address for messages and bookings.", meta: "Email" },
          { title: "Location", body: "Add the address, service area, or online availability.", meta: "Visit" }
        ]
      },
      {
        id: randomUUID(),
        type: "seo",
        title: "SEO content",
        body: "Keyword-focused copy that helps searchers understand the offer, location, and best reasons to choose this business.",
        cta: "",
        image: normalizeImage({ type: "seo", title: "SEO website content", image: { query: `${prompt} search engine marketing website content` } }, prompt),
        items: [
          { title: "Suggested page title", body: `${titleCase(businessSubject(prompt))} | Services for Local Customers`, meta: "Title" },
          { title: "Meta description", body: "Clear, benefit-led search copy that describes the business and encourages visitors to click.", meta: "Meta" },
          { title: "Keyword focus", body: businessSubject(prompt), meta: "SEO" }
        ]
      },
      {
        id: randomUUID(),
        type: "cta",
        title: "Ready to publish your idea?",
        body: "Refine the generated content, adjust the theme, and save the project.",
        cta: "Book a demo",
        image: normalizeImage({ type: "cta", title: "Call to action", image: { query: `${prompt} lifestyle` } }, prompt)
      }
    ]
  };
}

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

function compactProject(project = {}) {
  return {
    name: project.name || "Untitled website",
    prompt: project.prompt || "",
    theme: {
      primary: project.theme?.primary || "#2f6fed",
      background: project.theme?.background || "#ffffff",
      text: project.theme?.text || "#101418"
    },
    sections: Array.isArray(project.sections)
      ? project.sections.map((section) => ({
          id: section.id,
          type: section.type,
          title: section.title || "",
          body: section.body || "",
          cta: section.cta || "",
          image: section.image
            ? {
                alt: section.image.alt || "",
                query: section.image.query || ""
              }
            : undefined,
          items: Array.isArray(section.items)
            ? section.items.map((item) => ({
                title: item.title || "",
                body: item.body || "",
                meta: item.meta || ""
              }))
            : []
        }))
      : []
  };
}

function instructionTargetsSection(instruction, section) {
  const lowerInstruction = instruction.toLowerCase();
  const type = section.type?.toLowerCase() || "";
  const title = section.title?.toLowerCase() || "";
  const genericWords = new Set([
    "website",
    "section",
    "sections",
    "business",
    "generated",
    "customers",
    "customer",
    "designed",
    "built",
    "clear",
    "focused",
    "about",
    "your",
    "next",
    "ready"
  ]);
  const words = title
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !genericWords.has(word));

  if (type && lowerInstruction.includes(type)) return true;
  if (type === "faq" && lowerInstruction.includes("questions")) return true;
  if (type === "cta" && (lowerInstruction.includes("cta") || lowerInstruction.includes("call to action"))) return true;
  if (type === "features" && lowerInstruction.includes("feature")) return true;
  if (type === "testimonial" && lowerInstruction.includes("testimonial")) return true;

  return words.some((word) => lowerInstruction.includes(word));
}

function improveSectionPatch(section, instruction) {
  const lowerInstruction = instruction.toLowerCase();
  const premium = lowerInstruction.includes("premium") || lowerInstruction.includes("luxury");
  const modern = lowerInstruction.includes("modern");
  const strongerCta = lowerInstruction.includes("cta") || lowerInstruction.includes("call to action");

  if (section.type === "hero") {
    return {
      id: section.id,
      title: premium ? "Elevated experiences, built with precision" : "A sharper website for your next move",
      body: premium
        ? "Speak to a discerning audience with confident positioning, polished detail, and a clear reason to take the next step."
        : "Make the value clear faster with crisp copy, modern structure, and a focused path from interest to action.",
      cta: strongerCta ? "Start your transformation" : section.cta || "Start now"
    };
  }

  if (section.type === "services") {
    const items = Array.isArray(section.items) && section.items.length
      ? section.items.map((item, index) => ({
          title: item.title || `Service ${index + 1}`,
          body: item.body
            ? `${item.body.replace(/\.$/, "")}. Designed to feel clear, valuable, and easy to choose.`
            : "A clearly packaged offer that helps visitors understand the value and take the next step.",
          meta: item.meta || String(index + 1).padStart(2, "0")
        }))
      : [
          { title: "Signature Service", body: "A clear, high-value offer that explains the outcome customers can expect.", meta: "01" },
          { title: "Guided Support", body: "Helpful expertise that removes friction before, during, and after the purchase.", meta: "02" },
          { title: "Tailored Solutions", body: "Flexible options shaped around each customer's goals, timing, and needs.", meta: "03" }
        ];

    return {
      id: section.id,
      title: premium ? "Services crafted for elevated results" : "Services built around clear outcomes",
      body: "Turn your offers into simple, confident choices with sharper positioning, clearer benefits, and stronger reasons to act.",
      items
    };
  }

  if (section.type === "cta") {
    return {
      id: section.id,
      title: section.title || "Ready for the next step?",
      body: "Give visitors a stronger reason to act now with a clear promise and a low-friction next step.",
      cta: "Start your transformation"
    };
  }

  return {
    id: section.id,
    title: section.title,
    body: section.body
      ? `${section.body.replace(/\.$/, "")}. Clearer, ${modern ? "more modern" : "more confident"}, and easier to scan.`
      : "Focused copy that explains the value quickly and keeps visitors moving.",
    ...(Array.isArray(section.items) && section.items.length
      ? {
          items: section.items.map((item) => ({
            title: item.title || "Item",
            body: item.body
              ? `${item.body.replace(/\.$/, "")}. Clearer and easier to act on.`
              : "A sharper supporting point for this section.",
            meta: item.meta || ""
          }))
        }
      : {})
  };
}

function assistantFallback(project, instruction) {
  const lowerInstruction = instruction.toLowerCase();
  const current = compactProject(project);
  const updates = [];

  if (lowerInstruction.includes("dark")) {
    return {
      message: "Applied a darker, sharper theme and kept the section structure intact.",
      updates: {
        theme: {
          primary: "#8b5cf6",
          background: "#0f1220",
          text: "#f8fafc"
        },
        sections: []
      }
    };
  }

  const explicitlyTargetedSections = current.sections.filter((section) => instructionTargetsSection(instruction, section));

  if (explicitlyTargetedSections.length) {
    return {
      message: `Improved the ${explicitlyTargetedSections.map((section) => section.type).join(", ")} section${explicitlyTargetedSections.length === 1 ? "" : "s"}.`,
      updates: {
        theme: undefined,
        sections: explicitlyTargetedSections.map((section) => improveSectionPatch(section, instruction))
      }
    };
  }

  const isBroadWebsiteEdit =
    lowerInstruction.includes("website") ||
    lowerInstruction.includes("site") ||
    lowerInstruction.includes("overall") ||
    lowerInstruction.includes("suggest") ||
    lowerInstruction.includes("improvement") ||
    lowerInstruction.includes("improve");

  if (isBroadWebsiteEdit) {
    const preferredTypes = ["hero", "services", "about", "features", "cta"];
    const broadSections = preferredTypes
      .map((type) => current.sections.find((section) => section.type === type))
      .filter(Boolean)
      .slice(0, 4);
    const targetSections = broadSections.length ? broadSections : current.sections.slice(0, 3);

    return {
      message: `Suggested and applied ${targetSections.length} focused website improvement${targetSections.length === 1 ? "" : "s"}.`,
      updates: {
        theme: lowerInstruction.includes("modern")
          ? {
              primary: "#2563eb",
              background: "#f8fafc",
              text: "#0f172a"
            }
          : undefined,
        sections: targetSections.map((section) => improveSectionPatch(section, instruction))
      }
    };
  }

  current.sections.forEach((section, index) => {
    const isHero = section.type === "hero";
    const isCta = section.type === "cta" || lowerInstruction.includes("cta");
    const shouldUpdateCopy =
      lowerInstruction.includes("copy") ||
      lowerInstruction.includes("improve") ||
      lowerInstruction.includes("rewrite") ||
      lowerInstruction.includes("section") ||
      lowerInstruction.includes("premium") ||
      lowerInstruction.includes("luxury") ||
      lowerInstruction.includes("modern") ||
      lowerInstruction.includes("hero") ||
      lowerInstruction.includes("tone");

    if (isHero && shouldUpdateCopy) {
      updates.push({
        id: section.id,
        title: lowerInstruction.includes("luxury")
          ? "A more refined way to experience what matters"
          : lowerInstruction.includes("premium")
            ? "Elevated experiences, built with precision"
            : "A sharper website for your next move",
        body: lowerInstruction.includes("luxury") || lowerInstruction.includes("premium")
          ? "Speak to a discerning audience with confident positioning, polished detail, and a clear reason to take the next step."
          : "Make the value clear faster with crisp copy, modern structure, and a focused path from interest to action.",
        cta: section.cta || "Start now"
      });
      return;
    }

    if (isCta && (lowerInstruction.includes("cta") || lowerInstruction.includes("premium") || lowerInstruction.includes("modern"))) {
      updates.push({
        id: section.id,
        title: section.title || "Ready for the next step?",
        body: "Give visitors a stronger reason to act now with a clear promise and a low-friction next step.",
        cta: "Start your transformation"
      });
      return;
    }

    if (index > 0 && shouldUpdateCopy && updates.length < 3) {
      updates.push({
        id: section.id,
        title: section.title,
        body: section.body
          ? `${section.body.replace(/\.$/, "")}. Clearer, more confident, and easier to scan.`
          : "Focused copy that explains the value quickly and keeps visitors moving."
      });
    }
  });

  return {
    message: updates.length
      ? `Prepared ${updates.length} focused website edit${updates.length === 1 ? "" : "s"} from your instruction.`
      : "I can help with website copy, CTAs, sections, tone, and theme updates.",
    updates: {
      theme: lowerInstruction.includes("modern")
        ? {
            primary: "#2563eb",
            background: "#f8fafc",
            text: "#0f172a"
          }
        : undefined,
      sections: updates
    }
  };
}

function normalizeAssistantResponse(payload, project, instruction) {
  const fallback = assistantFallback(project, instruction);
  const sectionIds = new Set(compactProject(project).sections.map((section) => section.id).filter(Boolean));
  const sections = Array.isArray(payload?.updates?.sections)
    ? payload.updates.sections
    : Array.isArray(payload?.sections)
      ? payload.sections
      : [];

  const normalizedSections = sections
    .filter((section) => section?.id && sectionIds.has(section.id))
    .slice(0, 6)
    .map((section) => ({
      id: section.id,
      ...(section.title ? { title: section.title } : {}),
      ...(section.body ? { body: section.body } : {}),
      ...(typeof section.cta === "string" ? { cta: section.cta } : {}),
      ...(section.image && typeof section.image === "object"
        ? {
            image: {
              ...(section.image.alt ? { alt: section.image.alt } : {}),
              ...(section.image.query ? { query: section.image.query } : {})
            }
          }
        : {}),
      ...(Array.isArray(section.items)
        ? {
            items: section.items.slice(0, 6).map((item) => ({
              title: item.title || "Item",
              body: item.body || item.description || "",
              meta: item.meta || ""
            }))
          }
        : {})
    }));

  const theme = payload?.updates?.theme || payload?.theme;
  const normalizedTheme = theme && typeof theme === "object"
    ? {
        ...(theme.primary ? { primary: theme.primary } : {}),
        ...(theme.background ? { background: theme.background } : {}),
        ...(theme.text ? { text: theme.text } : {})
      }
    : undefined;
  const hasGeminiEdits = normalizedSections.length || (normalizedTheme && Object.keys(normalizedTheme).length);
  const fallbackHasEdits =
    fallback.updates.sections.length ||
    (fallback.updates.theme && Object.keys(fallback.updates.theme).length);

  if (!hasGeminiEdits && fallbackHasEdits) {
    return fallback;
  }

  return {
    message: payload?.message || fallback.message,
    updates: {
      theme: normalizedTheme,
      sections: normalizedSections
    }
  };
}

function buildAssistantPrompt(project, instruction) {
  return `
You are SiteForge AI, a lightweight website editing assistant inside a website editor.

You must only help with website editing tasks: improving sections, rewriting copy, changing tone, strengthening CTAs, suggesting colors/themes, and updating selected or relevant sections.
If the instruction is unrelated to website editing, return no section updates and briefly redirect to website editing.

Current project JSON:
${JSON.stringify(compactProject(project), null, 2)}

User instruction:
"${instruction}"

Return only valid JSON with this exact shape:
{
  "message": "one short editor-focused summary of the changes",
  "updates": {
    "theme": {
      "primary": "#hex optional",
      "background": "#hex optional",
      "text": "#hex optional"
    },
    "sections": [
      {
        "id": "must match an existing section id from the project JSON",
        "title": "optional updated title",
        "body": "optional updated copy",
        "cta": "optional updated button text",
        "image": {
          "query": "optional improved image search phrase",
          "alt": "optional alt text"
        },
        "items": [
          {
            "title": "optional updated card title",
            "body": "optional updated card body",
            "meta": "optional short label"
          }
        ]
      }
    ]
  }
}

Rules:
- Return structured updates, not generic chat.
- Preserve section ids and section order.
- Update only sections that are relevant to the instruction.
- Keep the website specific to its current business, audience, and purpose.
- Prefer concise, polished landing-page copy.
- Do not invent unrelated sections unless the user explicitly asks to regenerate a section.
- For theme updates, include only valid hex colors.
`;
}

function normalizeWebsite(payload, prompt) {
  const fallback = fallbackWebsiteDraft(prompt);
  const normalizedSections = Array.isArray(payload.sections) && payload.sections.length
    ? payload.sections.map((section, index) => ({
        id: section.id || randomUUID(),
        type: ["hero", "about", "services", "faq", "features", "testimonial", "cta", "sidebar", "contact", "seo"].includes(section.type) ? section.type : "features",
        title: section.title || "Untitled section",
        body: section.body || "",
        cta: section.cta || "",
        image: normalizeImage(section, prompt),
        items: Array.isArray(section.items)
          ? section.items.slice(0, 6).map((item) => ({
              title: item.title || "Item",
              body: item.body || item.description || "",
              meta: item.meta || item.rank || "",
              image: item.image && typeof item.image === "object" ? item.image : undefined
            }))
          : []
      }))
    : fallback.sections;

  return {
    name: payload.name || fallback.name,
    theme: {
      ...fallback.theme,
      ...(payload.theme || {})
    },
    sections: normalizedSections
  };
}

function buildPrompt(prompt) {
  return `
Create a concise website draft from this brief:
"${prompt}"

Return only valid JSON with this exact shape:
{
  "name": "short project name",
  "theme": {
    "primary": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "sections": [
    {
      "type": "hero|about|services|faq|testimonial|contact|seo|cta|sidebar|features",
      "title": "section title",
      "body": "section copy",
      "cta": "optional button text",
      "image": {
        "query": "short, specific stock photo search phrase matching this section; vary it from other sections",
        "alt": "specific image alt text"
      },
      "items": [
        {
          "title": "section-specific card title, ranking item, menu item, feature, or offer",
          "body": "section-specific card description",
          "meta": "optional short label like rank, price, or score"
        }
      ]
    }
  ]
}

Use these required sections for normal business websites: hero, about, services, faq, testimonial, contact, seo, cta.
If contact information is provided, include it in a "contact" section with useful items for phone, email, address, hours, or social links.
If SEO keywords are provided, include an "seo" section with a concise SEO title/meta-style summary and keyword-focused supporting items.
Include relevant, varied image metadata for every section. Do not reuse the same image query.
If the user asks for a sidebar, side navigation, filters, categories, table of contents, or left/right navigation panel, use type "sidebar" for that section and include 3 to 6 items.
For ranking, directory, menu, product, review, list, or comparison websites, include 3 to 6 specific items in the relevant sections.
If the brief mentions cars, auto, automobike, automobile, automotive, vehicles, or dealership, generate a car/automotive website with vehicle-specific copy and car/showroom image queries.
Do not use generic builder words like Generate, Customize, or Publish unless the user asked for a builder product.
Keep body copy polished and specific. Make the content suitable for responsive landing-page sections.
`;
}

function modelCandidates() {
  return [...new Set([
    process.env.GEMINI_MODEL,
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash"
  ].filter(Boolean))];
}

export async function generateWebsite(prompt, options = {}) {
  const imageOptions = options.includeImages === false
    ? { websiteImageBudget: 0, logoImageBudget: 0 }
    : undefined;

  if (!process.env.GEMINI_API_KEY) {
    return withImages(fallbackWebsiteDraft(prompt), prompt, imageOptions);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const errors = [];

  for (const modelName of modelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(
        model.generateContent(buildPrompt(prompt)),
        GEMINI_TEXT_TIMEOUT_MS,
        modelName
      );
      const text = result.response.text();
      return withImages(normalizeWebsite(parseJson(text), prompt), imageOptions);
    } catch (error) {
      errors.push(`${modelName}: ${error.message}`);
    }
  }

  console.warn("Gemini generation failed. Falling back to local generator.", errors);
  return withImages(fallbackWebsiteDraft(prompt), prompt, imageOptions);
}

export async function assistWebsiteEdit(project, instruction) {
  const trimmedInstruction = instruction?.trim();

  if (!trimmedInstruction) {
    return assistantFallback(project, "");
  }

  if (!process.env.GEMINI_API_KEY) {
    return assistantFallback(project, trimmedInstruction);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const errors = [];

  for (const modelName of modelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(
        model.generateContent(buildAssistantPrompt(project, trimmedInstruction)),
        GEMINI_ASSISTANT_TIMEOUT_MS,
        modelName
      );
      const text = result.response.text();
      return normalizeAssistantResponse(parseJson(text), project, trimmedInstruction);
    } catch (error) {
      errors.push(`${modelName}: ${error.message}`);
    }
  }

  console.warn("Gemini assistant edit failed. Falling back to local assistant.", errors);
  return assistantFallback(project, trimmedInstruction);
}
