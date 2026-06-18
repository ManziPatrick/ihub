# TODO

## Frontend build fixes (tsc + vite)
- [ ] Fix shared languageConfig import resolution by adding `frontend/src/shared` with re-exports from `backend/src/config/languageConfig.ts`.
- [ ] Ensure existing `@shared/*` imports (LANGUAGE_NAMES, LANGUAGE_COLORS, DEFAULT_INITIAL_CODE, etc.) resolve.
- [ ] Fix TS2322: `unknown` not assignable to `ReactNode` in `ManageCodeExercisesDialog.tsx`.
- [ ] Re-run `frontend` build (tsc -b && vite build) to confirm Docker build passes.

