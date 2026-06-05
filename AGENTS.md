# OpFin-FE Agent Guide

This document defines rules for AI-assisted development on this Next.js production frontend.

## Stack

- **Framework**: Next.js 15, App Router, React 19, TypeScript (strict)
- **Auth**: HTTP-only cookies (`opfin_access_token`, `opfin_role`) — set by Server Actions, read by middleware and Server Components
- **API communication**: `src/lib/api/client.ts` — typed client that switches between real backend and mock data
- **Testing**: Vitest (`npm run test`), full check via `npm run check`

## Security Rules

1. **Never expose session cookies to client JS.** All cookie reads happen server-side in Server Components or Server Actions. No `document.cookie`, no `localStorage` for tokens.
2. **All financial mutations go through Server Actions** (`src/app/actions.ts`). No client-side fetch to mutation endpoints.
3. **Validate redirect targets with `safeInternalPath`.** Never redirect to an arbitrary URL from user input.
4. **`NEXT_PUBLIC_USE_MOCK_API=true` is blocked in production builds** by `next.config.mjs`. Never remove this guard.
5. **`OPFIN_ENABLE_DEMO_SHORTCUTS=true` is blocked in production builds.** Same applies.
6. **Do not store PII or tokens in localStorage, sessionStorage, or client-side state.**

## Financial Display Rules

- All monetary values from the API arrive as UGX integer minor units (e.g. `amount_minor: number`).
- Use `formatUgx(value)` from `src/lib/format.ts` for all currency display. Never format amounts inline.
- Use helpers in `src/lib/finance.ts` for loan math (installments, interest, penalties, overdue days). Never do financial arithmetic inline in components.
- UGX has no sub-units — `amount_minor` is the same as the whole UGX amount. The minor-unit convention exists for consistency with the API contract.

## API Client

- `opfinApi` in `src/lib/api/client.ts` is the only entry point for backend calls.
- When adding a new API method: add a typed implementation, add a mock implementation, and add a test in `src/lib/api/client.test.ts`.
- Mock data in `src/lib/mock-data.ts` must use clearly fictional values (no real NINs, no real phone numbers, no real names).

## Monitoring

- `src/lib/monitoring.ts` is the only entry point for error reporting.
- Call `initMonitoring()` once at app startup (e.g. root layout) to initialise Sentry when `NEXT_PUBLIC_SENTRY_DSN` is configured.
- Use `captureError(error, context?)` in every `catch` block in Server Components and Server Actions. Never swallow errors silently in production paths.
- Use `setUser({ id })` after login to attach a non-PII identifier to crash reports. Never pass email, phone, or name.
- `@sentry/nextjs` is an optional peer dependency — the module falls back to `console.error` if not installed. Monitoring functions are safe to call unconditionally.

## Testing

- `npm run test` runs Vitest.
- `npm run check` runs typecheck + lint + test + build — all four must pass before merging.
- Test files live alongside source files as `*.test.ts`.
- Use relative imports inside the same directory; use `@/` alias for cross-directory imports.
- All pure functions in `src/lib/` must have test coverage.

## Route Protection

- Protected route prefixes are defined in `middleware.ts` (`protectedPrefixes`) and in `config.matcher`.
- Adding a new protected route requires updating **both** `protectedPrefixes` and `config.matcher` in `middleware.ts`.
- Role-gated routes (`/admin`, `/employer`) check the `opfin_role` cookie in `middleware.ts`.

## Adding New Pages

- All portal pages live under `src/app/(portal)/`.
- Use `Screen` from `src/components/Screen.tsx` for the page wrapper.
- Use `StateNotice` for all error and empty states — never throw unhandled API errors in a Server Component.
- Every page that calls `opfinApi` must catch `OpfinApiError` and render a `StateNotice` with the appropriate error kind.

## Environment Variables

All required variables are documented in `.env.example`. Add new variables there when introducing them.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_OPFIN_API_URL` | In production | Backend API base URL |
| `NEXT_PUBLIC_USE_MOCK_API` | Dev only | Enable mock API responses |
| `OPFIN_ENABLE_DEMO_SHORTCUTS` | Dev only | Enable demo shortcut flows |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for production crash reporting |
