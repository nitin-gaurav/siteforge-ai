# Vercel Deployment Routing

Place `vercel.json` in the repository root, next to the root `package.json`.

This project deploys the Vite frontend from `client/dist` and exposes the Express app through the Vercel serverless function at `api/index.js`.

The rewrite order is important:

1. `/api/*` -> `api/index.js`
2. `/health` -> `api/index.js`
3. everything else -> `index.html`

That keeps backend API routes working while allowing React Router routes such as `/dashboard`, `/editor/:id`, and `/login` to refresh without returning `404: NOT_FOUND`.

## Root `vercel.json`

```json
{
  "version": 2,
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "functions": {
    "api/index.js": {
      "includeFiles": "server/src/**",
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/health",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Deployment Steps

1. Push the latest code to GitHub.
2. Import the root repository in Vercel, not only the `client` folder.
3. Keep the framework preset as Vite or Other; the root `vercel.json` provides the build and output settings.
4. Add production environment variables in Vercel:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=/api
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
CLIENT_URL=https://your-vercel-domain.vercel.app
```

5. Deploy from Vercel.
6. After deployment, test these URLs:

```text
https://your-vercel-domain.vercel.app/dashboard
https://your-vercel-domain.vercel.app/editor/some-id
https://your-vercel-domain.vercel.app/api/projects
```

Refreshing frontend routes should load the React app. API URLs should hit Express.
