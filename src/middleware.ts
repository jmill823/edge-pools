import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedPage = createRouteMatcher([
  '/dashboard(.*)',
  '/pool(.*)',
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // Public pages + public API routes — skip auth entirely
  if (pathname.startsWith('/join/')) return NextResponse.next()
  if (pathname.startsWith('/api/cron/')) return NextResponse.next()
  if (pathname.startsWith('/api/admin/')) return NextResponse.next()
  if (pathname.startsWith('/api/tournaments')) return NextResponse.next()
  if (pathname.startsWith('/api/templates')) return NextResponse.next()
  if (pathname.startsWith('/api/golfers')) return NextResponse.next()
  if (pathname.startsWith('/api/pools/join/')) return NextResponse.next()

  // Protected pages — redirect to sign-in
  if (isProtectedPage(req)) {
    const session = await auth()
    if (!session.userId) {
      return session.redirectToSignIn()
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
