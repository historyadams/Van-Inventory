'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, APP_NAME } from '../components/TopBar';
import { PasswordCard } from '../components/PasswordCard';
import { CogIcon } from '../components/ui';

export default function LandingClient({ imUnlocked, scUnlocked }) {
  const router = useRouter();
  const [cogOpen, setCogOpen] = useState(false);

  function handleCog() {
    if (scUnlocked) router.push('/sc');
    else setCogOpen(true);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <TopBar
        right={
          <button
            onClick={handleCog}
            aria-label="Supply Chain settings"
            title="Supply Chain"
            className="tile-btn !h-10 !w-10 !p-0"
          >
            <CogIcon />
          </button>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-dim uppercase mb-3">
            <span className="w-8 h-px bg-white/20" />
            Supply Chain Ops
            <span className="w-8 h-px bg-white/20" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">{APP_NAME}</h1>
          <p className="mt-3 text-muted max-w-md mx-auto">
            Log what gets loaded from the warehouse into each van.
          </p>
        </div>

        {imUnlocked ? (
          <div className="card w-full max-w-sm p-7">
            <p className="section-title">Inventory Management</p>
            <p className="text-sm text-muted mt-2 mb-5">You're already logged in for this session.</p>
            <button onClick={() => router.push('/im')} className="tile-hero">
              Continue &rarr;
            </button>
          </div>
        ) : (
          <PasswordCard
            role="im"
            subtitle="Inventory Management"
            title="Enter the password"
            destination="/im"
          />
        )}
      </div>

      {cogOpen && (
        <div className="modal-backdrop" onClick={() => setCogOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <PasswordCard
              role="sc"
              subtitle="Supply Chain"
              title="Enter the password"
              destination="/sc"
              onCancel={() => setCogOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
