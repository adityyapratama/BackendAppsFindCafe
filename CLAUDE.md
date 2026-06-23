# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FindCafe backend API: Node.js + Express + TypeScript + Prisma ORM on PostgreSQL. Serves a café/coworking-space directory app with auth, place listings, reviews/favorites, and an admin moderation workflow.

## Commands

```bash
npm run dev              # nodemon + ts-node, runs src/app.ts directly (no build step needed)
npm run build             # prisma generate && prisma db push && tsc -> dist/
npm start                 # node dist/app.js (production, requires build first)
npm test                  # jest --forceExit --detectOpenHandles
npm run test:watch
npm run test:coverage
npx jest tests/place.test.ts          # run a single test file
npx jest -t "should return list"      # run tests matching a name

npm run prisma:generate   # prisma generate
npm run prisma:push       # prisma db push (no migration files are used — schema is pushed directly)
npm run prisma:studio
npm run seed               # node prisma/seed.js
```

Local setup requires `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` set in `.env` (validated at startup by `src/config/env.ts`); see `.env.example`. Cloudinary vars are optional (used for photo upload).

## Architecture

Layered structure, one file per resource at each layer:

```
routes/*.routes.ts  ->  controllers/*.controller.ts  ->  services/*.service.ts  ->  prisma (config/prisma.ts)
```

- **Routes** wire HTTP verb + path to a controller, with `auth`/`authorize` and `validate(schema)` middleware applied inline per-route (see `src/routes/place.routes.ts`).
- **Controllers** are thin: call the matching service function, wrap the result with `successResponse`/`errorResponse` (`src/utils/response.ts`), and forward errors to `next(error)`. No business logic lives here.
- **Services** hold all business logic and all Prisma calls. They throw plain `Error` objects with a `.statusCode` (and sometimes `.errors`) attached, or the typed errors from `src/errors/index.ts` (`AppError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`). Both styles are handled by `src/middleware/errorHandler.ts`.
- **Validations** (`src/validations/*.validation.ts`) are Joi schemas, applied via `validate()` middleware (`src/middleware/validate.ts`) which runs against `req.body` and returns a 400 with a `{field: [messages]}` errors map on failure.

Routes are mounted under both `/api/v1` and `/api` (back-compat alias) in `src/app.ts`; resource prefixes are registered in `src/routes/index.ts` (`/auth`, `/categories`, `/tags`, `/places`, `/favorites`, `/recommendations`, `/reviews`, `/admin`).

### Auth

JWT-based. `src/middleware/auth.ts` exports `auth` (verifies bearer token, sets `req.user`) and `authorize(...roles)` (checks `req.user.role`). Access tokens are short-lived (`JWT_EXPIRES_IN`); refresh tokens are long-lived (30d, hardcoded in `src/services/auth.service.ts`), stored in the `RefreshToken` table, and rotated on use (old one revoked, new one issued). Roles are plain strings on `User.role` (`user` / `admin`), not an enum.

### Data model (prisma/schema.prisma)

No migrations directory is used — schema changes go straight via `prisma db push`. Key flow: `User` submits a `Place` (status `pending` by default) -> admin approves/rejects (tracked via `status`, `approvedBy`, `approvedVia`, `rejectionReason`). The same pending/approved/rejected pattern repeats for `PlacePhoto` and `Review`. `AppSettings` (singleton row) controls whether place/review/photo submissions are auto- or manually-approved (`APPROVAL_MODE` in `src/constants/index.ts`). Users can also file `Report`s or `PlaceEditRequest`s against existing places, which admins resolve/review. All admin actions are expected to be recorded in `ModerationLog`. All IDs are `BigInt` — see below.

### BigInt handling

Prisma `BigInt` IDs are not JSON-serializable by default. `src/utils/bigIntToJson.ts` monkey-patches `BigInt.prototype.toJSON` and is imported once at the top of `src/app.ts` before anything else touches the DB. Don't manually `.toString()` IDs in responses; the patch handles it globally.

### Caching

`src/services/cache.service.ts` wraps `node-cache` (in-process, not Redis) for categories, tags, place detail, and app settings, with TTLs defined in the same file. Use `invalidatePattern(prefix)` to bust related keys after writes (e.g. on place update, invalidate `place:<id>`).

### Response shape

All endpoints return `{ success, message, data, errors?, meta? }` via `successResponse`/`errorResponse`. List endpoints return pagination/filter info under `meta` (controllers typically destructure `{ items, ...meta }` from the service result — see `getPlaces` in `place.controller.ts`).

### Error handling

Throw errors in services; never format error responses there. `errorHandler` (registered last in `src/app.ts`) special-cases Prisma `P2002` (unique constraint -> 409) and `P2025` (not found -> 404), falls back to `err.statusCode` if present, and otherwise returns 500 (with stack trace only when `NODE_ENV=development`).

### Misc

- `src/middleware/sanitize.ts` runs globally on all bodies before rate limiting.
- Rate limits: 500 req/15min on `/api/v1/*`, tighter 50 req/15min on `/api/v1/auth/*`.
- Swagger docs are hand-assembled in `src/config/swagger.ts` + `src/docs/*.ts`, served at `/docs` (UI) and `/docs.json` (raw spec).
- `app.listen` only runs when `src/app.ts` is the entrypoint (`require.main === module`), so importing `app` in tests (`tests/*.test.ts`, via supertest) does not start a real server or hit the port — but it does still connect to the real `DATABASE_URL`.
- Deployed on Render (`render.yaml`) and previously adapted for Vercel serverless (see recent commits) — check `src/app.ts`'s `require.main` guard before changing server bootstrap logic.
