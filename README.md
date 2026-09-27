# sfs-shop

A shop frontend built with Next.js 16 (App Router), React 19, Tailwind CSS v4 and shadcn/ui (Base UI). One codebase serves two apps:

- **Storefront** (port 3000): public product catalog with search, category filter and product detail pages.
- **Dashboard** (port 3001): admin area for managing products, categories, users and roles, plus account settings.

All data comes from an external REST API. This repo holds no backend.

## Getting started

Requirements: Node.js 20+ and a running instance of the sfs-shop API.

```bash
npm install
```

Create `.env.local` in the project root:

```bash
# Required: base URL of the backend API
NEXT_PUBLIC_API_BASE_URL=https://your-api-host

# Optional: cross-links between the two apps (defaults shown)
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
```

Start both apps:

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Dashboard: http://localhost:3001 (sign in at `/login`)

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Runs the storefront and dashboard dev servers together |
| `npm run dev:web` | Storefront dev server only (port 3000) |
| `npm run dev:dashboard` | Dashboard dev server only (port 3001, builds into `.next-dashboard`) |
| `npm run build` | Production build |
| `npm run start` | Serves both apps from the production build |
| `npm run start:web` / `start:dashboard` | Serves one app from the production build |
| `npm run lint` | Runs ESLint |

## How the two apps share one codebase

Each server is started with an `APP_TARGET` environment variable (`web` or `dashboard`), and `src/proxy.ts` routes requests based on it:

- **`web`**: serves `src/app/(web)`. The `/dashboard` and `/login` routes return 404.
- **`dashboard`**: serves `src/app/dashboard` at the root of the port, so `/products` maps to `app/dashboard/products`. Old `/dashboard/...` URLs redirect to the short form. `/login` is served as is.

In development the dashboard server uses its own build folder (`NEXT_DIST_DIR=.next-dashboard`, read in `next.config.ts`), so the two dev servers can run side by side.

## Project structure

```
src/
  app/
    (web)/              Storefront: catalog (/) and product detail (/products/[id])
    dashboard/          Admin: overview, products, categories, users, roles, settings
    login/              Dashboard sign-in page
    layout.tsx          Root layout (theme, auth, toasts)
  components/
    ui/                 shadcn/ui primitives
    dashboard/          Shared dashboard pieces (tables, pagination, dialogs)
    dashboard-shell.tsx Dashboard sidebar layout; redirects signed-out users to /login
    site-header.tsx     Storefront header
  hooks/                Data-fetching and hydration hooks
  lib/                  API client and one module per resource
  proxy.ts              Routes each request to the storefront or dashboard
```

## Backend API

`src/lib/api-client.ts` creates an axios instance pointed at `NEXT_PUBLIC_API_BASE_URL`. After login, the JWT is stored in `localStorage` and sent as a `Bearer` token on every request.

The app calls these endpoints:

| Resource | Endpoints |
| --- | --- |
| Auth | `POST /api/Auth/Login`, `GET /api/Auth/Me` |
| Products | `GET /api/Product/GetAll` (paged, `search`, `categoryId`), `GET /api/Product/GetById`, `POST /api/Product/Post`, `PUT /api/Product/Update/{id}`, `DELETE /api/Product/Delete` |
| Images | `POST /api/ImageUpload` |
| Categories | `GET /api/Category/GetAll`, `POST /api/Category/Post`, `PUT /api/Category/Update/{id}`, `DELETE /api/Category/Delete` |
| Users | `GET /api/User/GetAll`, `GET /api/User/GetById`, `POST /api/User/Post`, `PUT /api/User/Update/{id}`, `DELETE /api/User/Delete` |
| Roles | `GET /api/Role/GetAll`, `POST /api/Role/Post`, `PUT /api/Role/Update/{id}`, `DELETE /api/Role/Delete` |

## Notes for contributors

This project uses Next.js 16, which changes some APIs and conventions (for example, `middleware.ts` is now `proxy.ts`). Check the docs bundled in `node_modules/next/dist/docs/` before relying on older Next.js knowledge. See `AGENTS.md`.
