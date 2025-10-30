import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">Timeline</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/portfolio" className="text-gray-700 hover:text-gray-900">Portfolio</Link>
          <Link href="/editor" className="text-gray-700 hover:text-gray-900">New Card</Link>
          <button className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 transition" aria-label="Profile">
            <span className="sr-only">Profile</span>
          </button>
        </nav>
      </div>
    </header>
  );
}


