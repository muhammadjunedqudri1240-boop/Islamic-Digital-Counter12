# Smart Tasbeeh Pro

A premium, ultra-modern installable PWA Islamic Tasbeeh counter app — designed to feel like the finest digital prayer beads ever crafted.

## Run & Operate

- `pnpm --filter @workspace/smart-tasbeeh-pro run dev` — run the app (port varies, use workflow)
- `pnpm --filter @workspace/smart-tasbeeh-pro run typecheck` — typecheck the app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS, shadcn/ui, Framer Motion
- Storage: IndexedDB (via custom `db.ts` wrapper — no external ORM)
- PWA: Service Worker + Web App Manifest (SVG icons)
- State: React hooks only (no Redux/Zustand)
- Audio: Web Audio API (8 sounds generated programmatically)
- Notifications: Web Notifications API

## Where things live

- `artifacts/smart-tasbeeh-pro/` — main app
  - `src/lib/db.ts` — IndexedDB wrapper (history, sessions, notifications, settings)
  - `src/lib/sounds.ts` — Web Audio API sound generation
  - `src/lib/themes.ts` — 5 themes with CSS variable definitions
  - `src/lib/hijri.ts` — Hijri date via `Intl.DateTimeFormat` with `ca-islamic`
  - `src/lib/receipt.ts` — Canvas-based receipt/certificate generation
  - `src/lib/notifications.ts` — Web Notifications + prayer times
  - `src/hooks/` — useCounter, useSettings, useHistory, useStats, usePWA
  - `src/pages/` — CounterPage, HistoryPage, StatsPage, SettingsPage, NotificationsPage
  - `src/components/AppLayout.tsx` — bottom nav + PageTransition wrapper
  - `public/sw.js` — Service Worker for offline support
  - `public/manifest.json` — PWA manifest

## Architecture decisions

- IndexedDB chosen over localStorage for structured data (history, sessions) with better querying capability
- All sounds generated via Web Audio API oscillators — no external audio files needed
- Hijri date uses `Intl.DateTimeFormat` with `ca-islamic` locale for native browser accuracy
- CSS custom properties for theming — `applyTheme()` writes vars to `:root` on demand
- Service Worker caches all static assets for full offline support
- Pages are thin route components; all business logic lives in hooks

## Product

- **Counter Page**: 3D metallic counter device (LCD display + large tap button), 9 zikr presets, pause/lock/reset, target progress, save & share session
- **History Page**: Filterable session history (All/Achieved/Today/Week), saved sessions grid, export CSV
- **Stats Page**: Total counts, streaks, bar charts, ring progress, zikr breakdown
- **Settings Page**: 5 themes, 8 sounds with volume, vibration, display style, data import/export, PWA install
- **Notifications Page**: Prayer time reminders (Fajr/Dhuhr/Asr/Maghrib/Isha) + custom reminders

## User preferences

- Premium Islamic aesthetic — golden dark theme, Arabic text, no emojis in UI
- Mobile-first, max 480px centered on desktop
- Every animation should feel satisfying and intentional

## Gotchas

- The `AppLayout` in `App.tsx` wraps all routes — pages should NOT render `<AppLayout>` internally, only use `<PageTransition>` from it
- Do not use `console.log` — use the browser DevTools directly for debugging
- CSS classes `.btn-3d`, `.lcd-display`, `.glass`, `.glass-card` are defined in `index.css`
