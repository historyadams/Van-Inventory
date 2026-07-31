import { NextResponse } from 'next/server';
import { verifyRoleCookie, IM_COOKIE_NAME, SC_COOKIE_NAME } from './lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/im')) {
    const imValue = req.cookies.get(IM_COOKIE_NAME)?.value;
    const imRole = await verifyRoleCookie(imValue);
    if (imRole !== 'im') {
      return NextResponse.redirect(new URL('/login/im', req.url));
    }
  }

  if (pathname.startsWith('/sc')) {
    const scValue = req.cookies.get(SC_COOKIE_NAME)?.value;
    const scRole = await verifyRoleCookie(scValue);
    if (scRole !== 'sc') {
      return NextResponse.redirect(new URL('/login/sc', req.url));
    }
  }

  if (pathname.startsWith('/audit')) {
    const imValue = req.cookies.get(IM_COOKIE_NAME)?.value;
    const scValue = req.cookies.get(SC_COOKIE_NAME)?.value;
    const imRole = await verifyRoleCookie(imValue);
    const scRole = await verifyRoleCookie(scValue);
    if (imRole !== 'im' && scRole !== 'sc') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/im/:path*', '/sc/:path*', '/audit/:path*'],
};
