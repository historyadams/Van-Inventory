import { NextResponse } from 'next/server';
import { IM_COOKIE_NAME, SC_COOKIE_NAME } from '../../../lib/auth';

export async function POST(req) {
  const { role } = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });

  if (role === 'im') {
    res.cookies.set(IM_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  } else if (role === 'sc') {
    res.cookies.set(SC_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  } else {
    // No role specified - clear both, just to be safe.
    res.cookies.set(IM_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    res.cookies.set(SC_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  }

  return res;
}
