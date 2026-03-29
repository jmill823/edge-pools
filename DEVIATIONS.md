# Deviations from Spec

## Phase 1

### 1. Clerk v6 instead of latest (v7)
- **Reason:** Clerk v7 (`@clerk/nextjs@^7`) requires Next.js 15+. Since the spec locks Next.js at 14, we use `@clerk/nextjs@^6` which is the latest version compatible with Next.js 14.
- **Impact:** None — Clerk v6 API is fully functional with `clerkMiddleware`, `ClerkProvider`, pre-built components, and `currentUser()`.

### 2. Prisma v5 instead of latest (v7)
- **Reason:** Prisma v7 requires Node.js >=20.19. The build environment runs Node v20.11. Prisma v5 is the latest version compatible.
- **Impact:** None — all schema features used are supported in Prisma v5.
