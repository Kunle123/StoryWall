'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';

// Mock data - will be replaced with real API calls
const mockEvents = [
  { id: '1', year: 1886, month: 1, day: 29, title: 'Patent Motorwagen', description: 'Karl Benz patents the Motorwagen.', category: 'innovation', image: null, video: null, likes: 1247, shares: 234 },
  { id: '2', year: 1908, month: 10, day: 1, title: 'Model T Introduction', description: 'Ford introduces the Model T.', category: 'milestone', image: null, video: null, likes: 892, shares: 156 },
  { id: '3', year: 1913, title: 'Moving Assembly Line', description: 'Ford deploys moving assembly line.', category: 'innovation', image: null, video: null, likes: 1105, shares: 198 },
];

const mockComments = [
  { id: 'c1', author: 'HistoryBuff', authorId: 'u1', avatar: null, content: 'Amazing milestone!', timestamp: '2 hours ago', likes: 12 },
  { id: 'c2', author: 'AutoFan', authorId: 'u2', avatar: null, content: 'Love the detailed descriptions.', timestamp: '5 hours ago', likes: 8 },
];

export default function MainTimelinePage() {
  const [viewMode, setViewMode] = useState<'vertical' | 'hybrid'>('vertical');
  const [zoom, setZoom] = useState(100);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Timeline URL copied to clipboard!');
  };

  const handlePostComment = () => {
    if (newComment.trim()) {
      // TODO: API call
      setNewComment('');
    }
  };

  // Calculate decade ranges
  const minYear = Math.min(...mockEvents.map(e => e.year));
  const maxYear = Math.max(...mockEvents.map(e => e.year));
  const decades = [];
  for (let y = Math.floor(minYear / 10) * 10; y <= maxYear; y += 10) {
    decades.push(y);
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Title Section */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-4xl font-bold mb-2">Interactive Timeline</h1>
        <p className="text-gray-600">Explore historical events through time</p>
      </div>

      {/* Timeline Controls - Sticky */}
      <div className="sticky top-[57px] z-30 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('vertical')}
                className={`px-4 py-2 text-sm ${viewMode === 'vertical' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
              >
                Vertical
              </button>
              <button
                onClick={() => setViewMode('hybrid')}
                className={`px-4 py-2 text-sm ${viewMode === 'hybrid' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
              >
                Hybrid
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                aria-label="Zoom out"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(300, zoom + 10))}
                className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
          >
            Share Timeline
          </button>
        </div>
      </div>

      {/* Timeline Display */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

          {/* Timeline Cards */}
          <div className="space-y-6">
            {decades.map((decade, idx) => {
              const decadeEvents = mockEvents.filter(e => Math.floor(e.year / 10) * 10 === decade);
              if (decadeEvents.length === 0 && idx < decades.length - 1) return null;

              return (
                <div key={decade} className="relative pl-20">
                  {/* Decade Marker */}
                  <div className="absolute left-6 w-5 h-5 bg-gray-700 rounded-full border-4 border-white shadow" />
                  <div className="absolute left-12 top-0.5 text-sm font-medium text-gray-700">
                    {decade}s
                  </div>

                  {/* Events for this decade */}
                  {decadeEvents.length > 0 && (
                    <div className="space-y-4 mt-6">
                      {decadeEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500">
                                  {event.year}{event.month ? `/${event.month}` : ''}{event.day ? `/${event.day}` : ''}
                                </span>
                                {event.category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                    {event.category}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                              {event.description && (
                                <p className="text-gray-600 text-sm">{event.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              {event.image && (
                                <span className="text-xs text-gray-400" title="Has image">📷</span>
                              )}
                              {event.video && (
                                <span className="text-xs text-gray-400" title="Has video">🎥</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Social Interactions Panel - Bottom */}
      <div className="max-w-6xl mx-auto px-4 pb-8 border-t pt-6 mt-8">
        <div className="flex items-center gap-6 mb-6">
          <button
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{mockEvents.reduce((sum, e) => sum + e.likes, 0)} Likes</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <span>💬</span>
            <span>{mockComments.length} Comments</span>
          </button>
          <button
            onClick={() => setFollowing(!following)}
            className={`px-4 py-2 rounded-lg ${following ? 'bg-gray-800 text-white' : 'border hover:bg-gray-50'}`}
          >
            {following ? 'Following' : 'Follow Creator'}
          </button>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold">Comments</h3>
          <div className="space-y-3">
            {mockComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{comment.content}</p>
                  <div className="flex items-center gap-4">
                    <button className="text-xs text-gray-500 hover:text-gray-700">Like ({comment.likes})</button>
                    <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2 pt-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
            />
            <button
              onClick={handlePostComment}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm self-end"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
