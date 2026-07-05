import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const enableWaitlist = process.env.NEXT_PUBLIC_ENABLE_WAITLIST === 'true'
  const { pathname } = request.nextUrl

  // Avoid redirect loops and allow standard asset paths & API routes
  if (
    pathname === '/waitlist' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/logo/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }

  if (enableWaitlist) {
    return NextResponse.redirect(new URL('/waitlist', request.url))
  }

  return NextResponse.next()
}
