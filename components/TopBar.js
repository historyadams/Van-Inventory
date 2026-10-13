import Link from 'next/link';

export const APP_NAME = 'Van Inventory Movement';

// Fixed 60px bar used on every page: logo left, two-line title center, and
// whatever the page passes as `right` (cog, sync status, log out).
export function TopBar({ right }) {
  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-30 h-[60px] grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 gap-3"
        style={{
          background: 'rgba(14,14,17,0.85)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="sm:min-w-[180px] flex items-center">
          <Link href="/" aria-label="Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pos360-logo.png" alt="POS360" className="h-7 sm:h-11 w-auto" />
          </Link>
        </div>
        <div className="text-center leading-none">
          <p className="text-[13px] sm:text-[18px] font-extrabold tracking-[0.14em] uppercase text-white">
            Supply Chain Ops
          </p>
          <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.36em] uppercase text-primary mt-[3px]">
            {APP_NAME}
          </p>
        </div>
        <div className="sm:min-w-[180px] flex items-center justify-end gap-3">{right}</div>
      </header>
      <div className="h-[60px]" />
    </>
  );
}

export function SyncStatus({ label = 'Synced' }) {
  return (
    <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-synced">
      <span className="sync-dot" />
      {label}
    </span>
  );
}

export function LogoutButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted hover:text-white border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition"
    >
      Log out
    </button>
  );
}
