import { NextResponse } from 'next/server';
import { verifyRoleCookie, IM_COOKIE_NAME, SC_COOKIE_NAME } from './lib/auth';

// Both logins now start from the landing page: the password box there for
// Inventory Management, and the cog in the upper right for Supply Chain.
export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/im')) {
    const imRole = await verifyRoleCookie(req.cookies.get(IM_COOKIE_NAME)?.value);
    if (imRole !== 'im') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/sc')) {
    const scRole = await verifyRoleCookie(req.cookies.get(SC_COOKIE_NAME)?.value);
    if (scRole !== 'sc') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Audit sheets can be printed from either login.
  if (pathname.startsWith('/audit')) {
    const imRole = await verifyRoleCookie(req.cookies.get(IM_COOKIE_NAME)?.value);
    const scRole = await verifyRoleCookie(req.cookies.get(SC_COOKIE_NAME)?.value);
    if (imRole !== 'im' && scRole !== 'sc') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/im/:path*', '/sc/:path*', '/audit/:path*'],
};
