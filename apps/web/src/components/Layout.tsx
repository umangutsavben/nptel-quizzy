import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-surface-700/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" aria-label="NPTEL Quiz Prep Home">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow transition-shadow group-hover:shadow-glow-lg">
              <span className="text-white font-extrabold text-lg">N</span>
            </div>
            <div>
              <span className="text-lg font-bold text-surface-50 tracking-tight">NPTEL Quiz</span>
              <span className="text-lg font-bold text-brand-400 tracking-tight ml-1">Prep</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="#download"
              className="btn-ghost text-sm hidden sm:flex"
            >
              📱 Get Android App
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800/60 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-surface-300 text-sm font-medium mb-1">
            Built by Umang, Meet &amp; Prince
          </p>
          <p className="text-surface-500 text-sm">
            NPTEL Quiz Prep — Free practice platform for NPTEL students
          </p>
          <p className="text-surface-600 text-xs mt-2">
            Not affiliated with NPTEL or IITs. Questions are for educational practice only.
          </p>
        </div>
      </footer>
    </div>
  );
}
