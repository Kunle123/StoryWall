export default function Footer() {
  return (
    <footer className="border-t mt-10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600 flex items-center justify-between">
        <p>© {new Date().getFullYear()} StoryWall</p>
        <div className="flex gap-4">
          <a href="https://github.com/Kunle123/StoryWall" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
        </div>
      </div>
    </footer>
  );
}


