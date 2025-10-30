'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useParams } from 'next/navigation';

// Mock data - would come from API
const mockStory = {
  id: '1',
  title: 'Patent Motorwagen',
  description: 'On January 29, 1886, Karl Benz applied for a patent for his "vehicle powered by a gas engine". The patent, number 37435, is regarded as the birth certificate of the automobile.',
  year: 1886,
  month: 1,
  day: 29,
  category: 'innovation',
  image: null,
  video: null,
  likes: 1247,
  shares: 234,
};

const mockComments = [
  { id: 'c1', author: 'HistoryBuff', authorId: 'u1', avatar: null, content: 'This changed everything!', timestamp: '2 hours ago', likes: 12 },
];

export default function StoryDetailPage() {
  const params = useParams();
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handlePostComment = () => {
    if (newComment.trim()) {
      // TODO: API call
      setNewComment('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-gray-600 hover:text-gray-900 mb-6 inline-block">
          ← Back to Timeline
        </Link>

        {/* Event Detail Card */}
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          {mockStory.image && (
            <div className="w-full h-64 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-500">Image</span>
            </div>
          )}
          {mockStory.video && (
            <div className="w-full h-64 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-500">Video</span>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">📅</span>
              <span className="text-sm text-gray-600">
                {mockStory.year}/{mockStory.month}/{mockStory.day}
              </span>
              {mockStory.category && (
                <>
                  <span className="text-sm text-gray-500">🏷️</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                    {mockStory.category}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-4">{mockStory.title}</h1>
            <p className="text-gray-700 leading-relaxed">{mockStory.description}</p>

            {/* Social Actions */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t">
              <button
                onClick={() => setLiked(!liked)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <span>{liked ? '❤️' : '🤍'}</span>
                <span>{mockStory.likes}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <span>📤</span>
                <span>{mockStory.shares}</span>
              </button>
              <button
                onClick={() => setFollowing(!following)}
                className={`px-4 py-2 rounded-lg ${following ? 'bg-gray-800 text-white' : 'border hover:bg-gray-50'}`}
              >
                {following ? 'Following' : 'Follow Creator'}
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h2 className="font-semibold mb-4">Comments ({mockComments.length})</h2>

          {/* Comment Input */}
          <div className="flex gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-2"
                rows={3}
              />
              <Button onClick={handlePostComment} size="sm">Post</Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {mockComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                  <div className="flex items-center gap-4">
                    <button className="text-xs text-gray-500 hover:text-gray-700">Like ({comment.likes})</button>
                    <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

