# Jenkins Library Codex Instructions

## Project
- React 19 + Vite app for the Jenkins family library catalog.
- Production deploys are handled by Vercel from pushes to `main`.
- The live data source is Supabase using schema `library`.

## Working Style
- Keep changes small, focused, and consistent with existing page/component patterns.
- For UI changes, follow `DESIGN_SYSTEM.md` and existing components before adding new patterns.
- Prefer local, feature-owned changes unless a pattern is already shared across screens.
- Do not rewrite broad areas of the app unless explicitly requested.

## Validation
- Run `npm run typecheck` before committing code changes.
- Run `npm run lint` when practical, but note there are existing lint failures unrelated to recent wishlist work:
  - `src/app/layout/AppNavigation.tsx`
  - `src/features/books/sections/StatsPageSections.tsx`
- If lint still fails only for those known issues, report that clearly instead of refactoring unrelated files.

## Git And Deployment
- Work on a branch or PR when running in Codex cloud.
- For this repo, merging or pushing to `main` triggers a Vercel production deploy.
- After a push or merge, check Vercel for the production deployment status and report the deployment URL when available.

## Supabase
- Add schema changes as SQL migrations under `supabase/migrations`.
- Do not assume local migrations are already applied to production.
- Before relying on new columns or views in the app, verify the live Supabase schema exposes them.
- Be careful with `books_with_series`; preserve its existing remote column shape unless intentionally changing consumers.

## Mobile Testing Workflow
- The expected workflow is: prompt Codex, review the diff, merge or push, wait for Vercel, test the live site on a phone, then iterate.
- When asked to adjust a tested behavior, prioritize the smallest change that can be quickly validated on the deployed app.
