'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ScLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'sc', password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Incorrect password.');
        setLoading(false);
        return;
      }
      router.push('/sc');
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-navy-50">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-navy-900/50 hover:text-navy-900/80 mb-6 inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 7H2M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <div className="rounded-2xl border border-navy-900/10 bg-white p-8 shadow-sm">
          <span className="font-mono text-xs px-2 py-1 rounded border border-dashed border-navy-900/20 text-navy-900/40">02</span>
          <h1 className="font-display text-2xl font-semibold text-navy-900 mt-3">Supply Chain</h1>
          <p className="text-sm text-navy-900/60 mt-1 mb-6">Enter the password to continue.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-navy-900/15 px-4 py-3 text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
            />
            {error && <p className="text-sm text-stock-down">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-lg bg-navy-900 text-white font-medium py-3 hover:bg-ember-600 transition disabled:opacity-40 disabled:hover:bg-navy-900"
            >
              {loading ? 'Checking...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
