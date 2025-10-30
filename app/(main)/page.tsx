import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-gray-100 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Create Beautiful Timelines for Anything
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The collaborative platform for visual storytelling through time
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/create">
              <Button size="lg">Create Timeline</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg">Explore Timelines</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


