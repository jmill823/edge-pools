import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/pool(.*)',
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (req.nextUrl.pathname.startsWith('/join/')) return
  if (req.nextUrl.pathname.startsWith('/api/cron/')) return
  if (isProtectedRoute(req)) {
    const session = await auth()
    if (!session.userId) {
      return session.redirectToSignIn()
    }
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
