# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Build for production (ESLint disabled)
npm run lint     # Run ESLint
npm run start    # Start production server
```

Requires Node >= 20.9.0. Set `NEXT_PUBLIC_API_URL` in `.env.local` before running.

## Architecture

**Next.js 15 App Router** with React 19. Pages live in `src/app/` using the file-system router. The root redirects `/` → `/dashboard`.

**Auth flow:**
- On app load, `Provider.jsx` calls `refreshAccessToken()` which hits `/auth/refresh/` (httpOnly cookie) to restore session
- `accessToken` lives only in Redux memory — never persisted
- `user` object is persisted to `localStorage`
- `withAuth` HOC wraps all dashboard page components to redirect unauthenticated users to `/auth/login`
- `AuthLoadingContext` signals when the auth check is complete, preventing flash redirects

**State management:** Redux Toolkit with a single `auth` slice (`src/core/store/index.ts`). The store only holds `{ user, accessToken }`.

**Directory layout:**
- `src/app/` — Next.js pages (`.jsx`). `auth/` for public routes, `dashboard/` for protected routes
- `src/auth/` — Auth hooks (`useAuth.ts`), Redux slice (`authSlice.ts`), API services (`authApi.ts`, `roleApi.ts`)
- `src/core/` — Shared components, HOC, interfaces, store, utils, routes config (`dashboardRoutes.ts`)
- `src/tada/` — Domain-specific components and API services (push notifications, in-app messages, POCs, pricing, etc.)
- `src/config/` — `apiConfig.ts` (exports `NEXT_PUBLIC_API_URL`), `genericVariables.ts` (notification type constants)
- `src/assets/fonts/` — SF Pro Display OTF fonts

**UI stack:** Mantine 7 + Tailwind CSS 4 + DaisyUI 5. Theme is initialized from CSS variables via `getThemeFromCSS()` and applied through `MantineProvider`.

**API calls:** All use `axios` with `withCredentials: true`. Base URL from `NEXT_PUBLIC_API_URL`. Access token passed as `Authorization: Bearer <token>` header where required.

**Routing/permissions:** `dashboardRoutes.ts` defines the sidebar navigation tree with optional `permission` fields (path strings). The Sidebar and Drawer components filter routes based on the user's permissions.

**File conventions:** Core/shared code is TypeScript (`.ts`/`.tsx`). Page components and most UI components are JavaScript (`.jsx`). New pages follow the `.jsx` pattern; new core/shared logic should use `.ts`/`.tsx`.
