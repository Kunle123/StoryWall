'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Mock data
const mockCards = [
  { id: '1', title: 'Patent Motorwagen', year: 1886, month: 1, day: 29, category: 'innovation', description: 'Karl Benz patents the Motorwagen.' },
  { id: '2', title: 'Model T Introduction', year: 1908, month: 10, category: 'milestone', description: 'Ford introduces the Model T.' },
];

export default function PortfolioPage() {
  const [cards, setCards] = useState(mockCards);

  const handleExport = () => {
    const json = JSON.stringify(cards, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.json';
    a.click();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this card?')) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
            <p className="text-gray-600">{cards.length} cards</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleExport}>Export JSON</Button>
            <Link href="/editor">
              <Button>New Card</Button>
            </Link>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold mb-2">No cards yet</h2>
            <p className="text-gray-600 mb-6">Create your first timeline card to get started</p>
            <Link href="/editor">
              <Button>Create First Card</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {cards.map((card) => (
                <div key={card.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition relative group">
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-xs"
                    aria-label="Delete"
                  >
                    ×
                  </button>
                  {card.category && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded mb-2 inline-block">
                      {card.category}
                    </span>
                  )}
                  <h3 className="font-semibold mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {card.year}{card.month ? `/${card.month}` : ''}{card.day ? `/${card.day}` : ''}
                  </p>
                  {card.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{card.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Usage Guide */}
            <div className="bg-gray-50 border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Usage Guide</h2>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="font-semibold text-gray-800">1.</span>
                  <span>Create cards using the editor to build your timeline</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-gray-800">2.</span>
                  <span>Export your portfolio as JSON to back up your work</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-gray-800">3.</span>
                  <span>Import JSON files to restore or share portfolios</span>
                </li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

