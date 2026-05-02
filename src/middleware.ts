import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /agents/login and /agents/page.tsx (public agent listing) are always accessible
  if (pathname === '/agents' || pathname === '/agents/login') {
    return NextResponse.next()
  }

  // All other /agents/* routes require a session cookie
  // Firebase uses client-side auth so we check for the __session cookie set by Firebase Hosting
  // or fall back to a lightweight token cookie we set after login
  const session = req.cookies.get('__session')?.value ?? req.cookies.get('fb-token')?.value

  if (!session) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/agents/login'
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/agents/:path+'],
}
