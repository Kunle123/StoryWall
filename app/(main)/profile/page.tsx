'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Mock signed in state - would come from auth
const [signedIn] = useState(false);

const mockProfile = {
  name: 'User Name',
  avatar: null,
  storyCount: 12,
  followersCount: 342,
  followingCount: 128,
  badges: ['Timeline Creator', 'History Enthusiast'],
};

const mockStories = [
  { id: '1', content: 'First timeline event about automotive history...', createdAt: '2024-01-15', reactions: 45, views: 234 },
  { id: '2', content: 'Another historical milestone documented...', createdAt: '2024-01-10', reactions: 32, views: 189 },
];

export default function ProfilePage() {
  const [isSignedIn] = useState(signedIn);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!isSignedIn ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Sign in to view your profile</h2>
            <p className="text-gray-600 mb-6">Create and manage your timeline stories</p>
            <Link href="/auth">
              <Button>Sign In / Sign Up</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Profile Header Card */}
            <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-300" />
                  <div>
                    <h1 className="text-2xl font-bold mb-1">Your Stories</h1>
                    <p className="text-gray-600">{mockProfile.storyCount} stories</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 border rounded-lg hover:bg-gray-50" aria-label="Settings">
                    ⚙️
                  </button>
                  <button className="w-10 h-10 border rounded-lg hover:bg-gray-50" aria-label="Logout">
                    🚪
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="text-sm text-gray-600">{mockProfile.followersCount} Followers</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">{mockProfile.followingCount} Following</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {mockProfile.badges.map((badge) => (
                  <span key={badge} className="text-xs px-3 py-1 bg-gray-100 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Stories List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Stories</h2>
              <div className="space-y-4">
                {mockStories.map((story) => (
                  <div key={story.id} className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-gray-700 mb-3 line-clamp-2">{story.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 {story.createdAt}</span>
                        <span>👍 {story.reactions}</span>
                        <span>👁️ {story.views}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

