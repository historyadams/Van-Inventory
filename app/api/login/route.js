import { NextResponse } from 'next/server';
import { signRole, IM_COOKIE_NAME, SC_COOKIE_NAME } from '../../../lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { role, password } = body;

  if (role !== 'im' && role !== 'sc') {
    return NextResponse.json({ error: 'Unknown login.' }, { status: 400 });
  }

  // Passwords live only in Vercel's Environment Variables - never in the code.
  const expected = role === 'im' ? process.env.IM_PASSWORD : process.env.SC_PASSWORD;
  if (!expected || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Login is not set up yet. Add IM_PASSWORD, SC_PASSWORD and SESSION_SECRET in Vercel.' },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const token = await signRole(role);
  const cookieName = role === 'im' ? IM_COOKIE_NAME : SC_COOKIE_NAME;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
