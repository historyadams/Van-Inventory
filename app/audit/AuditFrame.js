import { TopBar } from '../../components/TopBar';

// Shared screen chrome for the single and multi-van audit pages: the normal
// top bar plus Back / Print controls, all hidden when printing.
export function AuditFrame({ from, printLabel, children }) {
  return (
    <div className="min-h-screen print:min-h-0">
      <style>{`
        @page {
          size: letter portrait;
          margin: 0.4in;
        }
      `}</style>
      <div className="print:hidden">
        <TopBar />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
        <div className="flex items-center justify-between gap-3 mb-5 print:hidden">
          <a href={from} className="text-sm text-muted hover:text-white transition">
            &larr; Back to Van Inventory Movement
          </a>
          <button onClick={() => window.print()} className="btn-primary">
            {printLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuditMessage({ children }) {
  return <p className="text-center text-dim py-16 text-sm">{children}</p>;
}

export function auditBackHref(searchParams) {
  return searchParams.get('from') === 'im' ? '/im' : '/sc';
}

export function todayLong() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
