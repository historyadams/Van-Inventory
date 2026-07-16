import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-navy-50">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.2em] text-navy-700/60 uppercase mb-3">
            <span className="w-6 h-px bg-navy-700/30" />
            POS360 Field Ops
            <span className="w-6 h-px bg-navy-700/30" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-navy-900">
            Van Stock
          </h1>
          <p className="mt-3 text-navy-900/60 max-w-md mx-auto">
            Choose your login to track what moves between the warehouse and the vans.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <RoleCard
            href="/login/im"
            tag="01"
            title="Inventory Management"
            desc="Adjust item counts in a van and submit changes."
          />
          <RoleCard
            href="/login/sc"
            tag="02"
            title="Supply Chain"
            desc="Review incoming changes and confirm van locations."
          />
        </div>
      </div>
    </main>
  );
}

function RoleCard({ href, tag, title, desc }) {
  return (
    <Link
      href={href}
      className="group relative block rounded-2xl border border-navy-900/10 bg-white p-7 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 hover:border-ember/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
    >
      <span className="absolute top-5 right-5 font-mono text-xs px-2 py-1 rounded border border-dashed border-navy-900/20 text-navy-900/40">
        {tag}
      </span>
      <h2 className="font-display text-xl font-semibold text-navy-900 pr-10">{title}</h2>
      <p className="mt-2 text-sm text-navy-900/60 leading-relaxed">{desc}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ember-600 group-hover:gap-2.5 transition-all">
        Continue
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
