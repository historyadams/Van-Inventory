'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Password prompt shared by the landing page (Inventory Management) and the
// cog popup (Supply Chain). On success the server sets that role's cookie and
// we route to its page.
export function PasswordCard({ role, title, subtitle, destination, onCancel }) {
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
        body: JSON.stringify({ role, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Incorrect password.');
        setLoading(false);
        return;
      }
      router.push(destination);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-sm p-7">
      <p className="section-title">{subtitle}</p>
      <h2 className="text-xl font-bold text-white mt-2">{title}</h2>
      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          className="input"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <div className="flex gap-3 pt-1">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost flex-1">
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading || !password} className="btn-primary flex-1">
            {loading ? 'Checking...' : 'Log in'}
          </button>
        </div>
      </form>
    </div>
  );
}
