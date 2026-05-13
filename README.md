# SiteForge AI 🚀

> AI-powered website generation platform for small businesses. Describe your business — we'll build your website.

![SiteForge AI](https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80)

## 🔗 Live Demo

- **App:** [siteforge-ai.vercel.app](https://siteforge-ai.vercel.app)
- **API:** [siteforge-ai-server.onrender.com](https://siteforge-ai-server.onrender.com)

**Demo credentials:**
- Email: `demo@siteforge.ai`
- Password: `demo123456`

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Design](#system-design)
- [Key Architecture: JSON Section System](#key-architecture-json-section-system)
- [AI Integration](#ai-integration)
- [Features](#features)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Architectural Decisions](#architectural-decisions)

---

## Overview

SiteForge AI simulates a lightweight AI-powered website builder SaaS product. Users enter their business details, and the platform uses **Google Gemini AI** to generate a complete, professional website with relevant sections, contextual images, and a custom color theme — all editable inline with a live preview.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Fast dev experience, utility-first styling |
| State Management | Zustand | Lightweight, no boilerplate vs Redux |
| Routing | React Router v6 | Industry standard, nested routes |
| Backend | Node.js + Express | Simple REST API, easy AI service integration |
| Database & Auth | Supabase (PostgreSQL) | Auth + DB in one, RLS for security |
| AI Text | Google Gemini 2.5 Flash | Free tier, fast, good quality for content generation |
| Images | Gemini image generation + Unsplash API | AI-generated graphics for visual sections, with contextual stock fallback |

---

## System Design

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│  React + Vite + Tailwind + Zustand + React Router      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │ Auth     │  │Dashboard │  │ Editor Page           │ │
│  │ (Login/  │  │(Projects │  │ ┌─────────┬─────────┐ │ │
│  │ Signup)  │  │ Grid)    │  │ │Sidebar  │ Preview │ │ │
│  └──────────┘  └──────────┘  │ │(Edit)   │ (Live)  │ │ │
│                               │ └─────────┴─────────┘ │ │
│                               └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          │ REST API calls with Supabase JWT
          ▼
┌─────────────────────────────────────────────────────────┐
│                        SERVER                           │
│              Node.js + Express (Port 4000)              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth         │  │ Projects     │  │ AI Service   │  │
│  │ Middleware   │  │ Controller   │  │ Controller   │  │
│  │ (JWT verify) │  │ (CRUD)       │  │ (Gemini)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
          │                                │
          ▼                                ▼
┌──────────────────┐              ┌─────────────────────┐
│    Supabase      │              │   External APIs     │
│  (PostgreSQL)    │              │                     │
│                  │              │  • Google Gemini    │
│  • projects      │              │  • Unsplash API     │
│  • auth.users    │              │                     │
│  • RLS policies  │              └─────────────────────┘
└──────────────────┘
```

---

## Key Architecture: JSON Section System

The most important architectural decision in SiteForge AI is treating website sections as **dynamic JSON components** — the same approach used internally by Webflow and Framer.

### How it works

Every generated website is stored as a structured `jsonb` array in Supabase:

```json
[
  {
    "id": "uuid",
    "type": "hero",
    "title": "Your Brightest Smile Starts Here",
    "body": "Expert dental care designed for your comfort...",
    "cta": "Book Appointment",
    "image": {
      "url": "https://images.unsplash.com/...",
      "alt": "Dental clinic professional",
      "query": "dental clinic professional smile"
    },
    "items": []
  },
  {
    "id": "uuid",
    "type": "features",
    "title": "Our Services",
    "items": [
      { "title": "General Dentistry", "body": "..." },
      { "title": "Cosmetic Dentistry", "body": "..." }
    ]
  }
]
```

### SectionRenderer — the no-code core

```jsx
// Maps section type → React component dynamically
const sectionMap = {
  hero: HeroSection,
  features: FeaturesSection,
  testimonial: TestimonialSection,
  cta: CTASection,
}

export default function SectionRenderer({ sections }) {
  return sections.map((section) => {
    const Component = sectionMap[section.type]
    return <Component key={section.id} data={section} />
  })
}
```

**Why this matters:**
- Sections are data, not hardcoded HTML — fully editable and regeneratable
- Adding a new section type = add one React component + one key in `sectionMap`
- Infinitely extensible without touching generation logic
- Same JSON structure stored in DB, rendered in editor, and exportable

---

## AI Integration

### Gemini Prompt Architecture

Instead of one giant prompt, SiteForge AI uses **structured prompts** that instruct Gemini to return clean JSON for each section type:

```js
// server/services/gemini/textService.js
function buildPrompt(prompt) {
  return `
    Create a concise website draft from this brief: "${prompt}"
    
    Return ONLY valid JSON (no markdown, no backticks):
    {
      "name": "project name",
      "theme": { "primary": "#hex", "background": "#hex", "text": "#hex" },
      "sections": [
        {
          "type": "hero|features|testimonial|cta",
          "title": "...",
          "body": "...",
          "cta": "...",
          "image": { "query": "specific stock photo search phrase", "alt": "..." },
          "items": [{ "title": "...", "body": "..." }]
        }
      ]
    }
    
    Use 3-5 sections. Vary image queries across sections.
    Never use generic terms like "Generate" or "Customize".
  `
}
```
// Falls back gracefully if Gemini fails
try {
  return await generateWithGemini(prompt)
} catch {
  return fallbackWebsite(prompt) // curated fallback content
}
```

### AI-Powered Image Selection

Gemini extracts contextual image search queries per section. These are used to fetch relevant photos from Unsplash:

```js
// Each section gets a unique, context-aware image
"image": { "query": "dental clinic professional smile" }  // hero
"image": { "query": "dentist examining patient xray" }    // features
"image": { "query": "happy patient dental office" }       // cta
```

This ensures images are always relevant and never repeated across sections.

---

## Features

### ✅ Minimum Requirements
- [x] User authentication (signup/login with Supabase)
- [x] AI generates Hero, Features, Testimonial, CTA sections
- [x] AI-powered contextual image selection via Unsplash
- [x] Inline text editing for all section components
- [x] Real-time live preview while editing
- [x] Save projects to Supabase
- [x] Reopen and continue editing saved projects

### 🌟 Bonus Features Implemented
- [x] **Drag and drop** — reorder sections in Sections tab
- [x] **Theme/color generator** — Primary, Canvas, Text color pickers with live preview
- [x] **Mobile responsive preview** — Desktop / Tablet / Mobile toggle
- [x] **Regenerate individual sections** — per-section AI regeneration
- [x] **Dark/light mode** — full theme toggle
- [x] **AI chatbot assistant** — Gemini-powered editor assistant
- [x] **Advanced options** — Business name, Industry, Target audience, Tone inputs
- [x] **Lovable-style UX** — prompt-first home page with example chips
- [x] **Project dashboard** — rich card grid with thumbnails, section count, timestamps
- [x] **Confirmation dialog** — prevents accidental content overwrite on regenerate

---

## Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_details JSONB NOT NULL DEFAULT '{}',
  sections JSONB DEFAULT '[]',
  prompts JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can only access their own projects"
ON projects FOR ALL
USING (auth.uid() = user_id);
```

**Why JSONB for sections?**
- Schema-less — section structure can evolve without migrations
- Queryable with Postgres JSON operators
- Stored efficiently, retrieved in one query
- Perfect for dynamic, user-defined content structures

---

## Project Structure

```
/siteforge-ai
  /client
    /src
      /components
        /editor
          SectionEditor.jsx      ← inline field editor per section
        /preview
          SectionRenderer.jsx    ← maps type → component (core architecture)
        /sections
          HeroSection.jsx
          FeaturesSection.jsx
          TestimonialSection.jsx
          CTASection.jsx
        /ui
          Button.jsx, Input.jsx, Loader.jsx
      /pages
        /auth
          Login.jsx, Signup.jsx
        /dashboard
          Dashboard.jsx          ← project card grid
        /editor
          EditorPage.jsx         ← split layout: sidebar + preview
      /hooks
        useAuth.js
        useProject.js
      /store
        authStore.js             ← Zustand auth state
        editorStore.js           ← Zustand editor state (sections, theme)
      /services
        supabase.js
        api.js
  /server
    /routes
      projects.js
      ai.js
    /controllers
      projectController.js
      aiController.js
    /services
      /gemini
        textService.js           ← Gemini prompt + generation logic
    /middleware
      authMiddleware.js          ← Supabase JWT verification
    app.js
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Google AI Studio API key
- Unsplash Developer API key

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/siteforge-ai.git
cd siteforge-ai
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in the SQL Editor (see [Database Schema](#database-schema))
3. Copy your Project URL, anon key, and service role key

### 3. Install and run the server
```bash
cd server
npm install
cp .env.example .env
# Fill in your env variables
npm run dev
```

### 4. Install and run the client
```bash
cd client
npm install
cp .env.example .env
# Fill in your env variables
npm run dev
```

### 5. Open the app
Visit `http://localhost:5173`

---

## Environment Variables

### Client (`/client/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:4000
```

### Server (`/server/.env`)
```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
UNSPLASH_ACCESS_KEY=your_unsplash_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=4000
```

---

## Architectural Decisions

### Why Supabase over Firebase?
Supabase gives us PostgreSQL with JSONB support — critical for storing structured section data with queryability. Firebase's document model would make section ordering and querying more complex. Supabase also provides Row Level Security at the database level, not just the application layer.

### Why Zustand over Redux?
The editor needs fast, frequent state updates (every keystroke in inline editing triggers a re-render of the live preview). Zustand's minimal API and lack of boilerplate makes this performant without complex action/reducer patterns.

### Why JSON sections over a component-based DB schema?
Storing sections as JSONB gives us schema flexibility — new section types can be added without DB migrations. The tradeoff is less queryability on section internals, but since we always fetch complete projects, this is acceptable. This mirrors how Webflow stores page data internally.

### Why Gemini image generation plus Unsplash?
Gemini powers AI-generated artwork for logo, brand, and graphics sections. Unsplash remains the fallback for photo-heavy website sections, so generated pages still get reliable contextual imagery when an AI graphic is not needed or generation fails.

## What We're Evaluating (Assignment Criteria Met)

| Criteria | Implementation |
|---|---|
| Dynamic frontend rendering | SectionRenderer maps JSON → React components dynamically |
| Component architecture | Modular section components, reusable UI primitives |
| AI workflow design | Structured prompts, JSON schema enforcement, graceful fallbacks |
| Editor state management | Zustand store with live preview reactivity |
| Backend structure | Separated routes, controllers, services, middleware |
| Database schema quality | JSONB sections, RLS policies, normalized structure |
| User experience | Lovable-style UX, drag-and-drop, mobile preview, dark mode |

---

## Author

**Nitin** — Full Stack Developer  
Built as part of Zebvo AI technical assignment, May 2026.
