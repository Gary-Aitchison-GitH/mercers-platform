import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/agents' || pathname === '/agents/login' || pathname === '/agents/setup') {
    return NextResponse.next()
  }

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
