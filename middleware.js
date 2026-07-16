import { NextResponse } from 'next/server';
import { verifyRoleCookie, COOKIE_NAME } from './lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const role = await verifyRoleCookie(cookieValue);

  if (pathname.startsWith('/im') && role !== 'im') {
    return NextResponse.redirect(new URL('/login/im', req.url));
  }
  if (pathname.startsWith('/sc') && role !== 'sc') {
    return NextResponse.redirect(new URL('/login/sc', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/im/:path*', '/sc/:path*'],
};
