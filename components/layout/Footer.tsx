import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t mt-10">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} StoryWall. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/legal/terms" className="hover:underline">Terms & Conditions</Link>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/legal/cookies" className="hover:underline">Cookie Policy</Link>
            <Link href="/legal/acceptable-use" className="hover:underline">Acceptable Use</Link>
            <a href="https://github.com/Kunle123/StoryWall" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}


