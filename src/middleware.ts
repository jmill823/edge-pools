import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/pool(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public join page (viewing pool info before joining)
  if (req.nextUrl.pathname.startsWith('/join/')) {
    return
  }
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
