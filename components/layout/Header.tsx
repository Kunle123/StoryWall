import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">StoryWall</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/explore" className="text-gray-700 hover:text-gray-900">Explore</Link>
          <Link href="/demo" className="text-gray-700 hover:text-gray-900">Demo</Link>
        </nav>
      </div>
    </header>
  );
}


