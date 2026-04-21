# Task: API Docs Setup (OpenAPI + Redoc/Swagger)

## Goal
- Generate OpenAPI 3.1 spec from Zod
- Serve docs for developers (Swagger UI) and stakeholders (Redoc)
- Keep docs up to date via code-first generation

## Deliverables
- Scripts:
  - `npm run gen:openapi` -> create `api/docs/openapi/openapi.json`
  - `npm run dev` -> serve Redoc at `/api-docs` and Swagger at `/api-docs/swagger`
- Initial documented endpoints (examples):
  - GET `/api/endpoints/core/leads/leads-optimized`
  - POST `/api/endpoints/core/leads/lead-mutations`
  - GET `/api/endpoints/additional/auth/user-data`

## Implementation Summary
- Added dep: `@asteasolutions/zod-to-openapi` (zod already present)
- Enabled zod extension via `extendZodWithOpenApi(z)` in generator
- Created generator: `scripts/generate-openapi.ts`
- Vite dev server serves:
  - `/api-docs/openapi.json` (spec)
  - `/api-docs` (Redoc with dynamic load + fallback JSON preview)
  - `/api-docs/swagger` (Swagger UI)

## Commands
```
npm install
npm run gen:openapi
npm run dev
```
Open (use your dev port, e.g. 8080):
- Redoc: http://localhost:8080/api-docs
- Swagger: http://localhost:8080/api-docs/swagger

## Files Touched
- package.json (scripts + deps)
- scripts/generate-openapi.ts (Zod -> OpenAPI 3.1)
- vite-plugin-api.ts (serve docs routes, Redoc fallback)
- api/docs/openapi/openapi.json (generated output)
- README.md (root) (quick usage)

## File Organization
- Spec output: `api/docs/openapi/openapi.json`
- Generator: `scripts/generate-openapi.ts`
- Dev docs routes: `vite-plugin-api.ts` (`/api-docs`, `/api-docs/swagger`)

## Verification Checklist
- [x] `npm run gen:openapi` creates `api/docs/openapi/openapi.json`
- [x] `/api-docs` renders Redoc or fallback with spec preview
- [x] `/api-docs/swagger` shows Swagger UI with 3 example paths

## How to Add New Endpoints to Docs
1) Define or reuse Zod schemas in code
2) Register path in `scripts/generate-openapi.ts` using `registry.registerPath`
3) `npm run gen:openapi` and refresh docs

Example:
```
registry.registerPath({
  method: 'get',
  path: '/api/endpoints/core/inventory/inventory',
  summary: 'Get inventory',
  responses: { 200: { description: 'OK' } }
});
```

## Next Steps (Optional)
- Add more endpoints incrementally
- Add Redocly CLI for lint/bundle
- Generate TS types with `openapi-typescript`
- Add CI check for spec generation

## Checklist

### 1) Setup toolchain
- [x] Install deps: `npm install`
- [x] Confirm `@asteasolutions/zod-to-openapi` exists in package.json deps
- [x] Confirm scripts exist:
  - [x] `gen:openapi`
  - [x] `dev` (or `docs` if used)

### 2) Generate spec
- [x] Run `npm run gen:openapi`
- [x] Verify file created at `api/docs/openapi/openapi.json`
- [x] Validate JSON opens without error

### 3) Serve docs (dev)
- [x] Start dev server: `npm run dev`
- [x] Open Redoc at `http://localhost:8080/api-docs`
- [x] Open Swagger at `http://localhost:8080/api-docs/swagger`

### 4) Verify sample endpoints
- [ ] Redoc lists:
  - [ ] GET `/api/endpoints/core/leads/leads-optimized`
  - [ ] POST `/api/endpoints/core/leads/lead-mutations`
  - [ ] GET `/api/endpoints/additional/auth/user-data`
- [ ] Swagger "Try it out" works with mock inputs (where applicable)

### 5) Add a new endpoint to docs
- [ ] Define/reuse Zod schema (if needed)
- [ ] Register path in `scripts/generate-openapi.ts`
- [ ] Re-run `npm run gen:openapi`
- [ ] Refresh `/api-docs` and verify appears

### 6) Optional hardening
- [ ] Add Redocly CLI for lint/bundle
- [ ] Add `openapi-typescript` for TS typings from spec
- [ ] Add CI job to run `npm run gen:openapi`

Last updated: 2025-10-30
