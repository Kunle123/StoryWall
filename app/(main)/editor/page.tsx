'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const categories = ['event', 'vehicle', 'crisis', 'milestone', 'innovation'];

export default function CardEditorPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: '',
    month: '',
    day: '',
    category: '',
    imageUrl: '',
    videoUrl: '',
  });

  const isValid = formData.title.trim() && formData.year.trim();

  const handleSave = () => {
    // TODO: API call to save
    alert('Card saved to portfolio!');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Card Editor</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year *</label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  placeholder="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Video URL</label>
              <Input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid}
              >
                Save to Portfolio
              </Button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="hidden lg:block">
            {showPreview && (
              <div className="sticky top-20">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {formData.year || 'Year'}{formData.month ? `/${formData.month}` : ''}{formData.day ? `/${formData.day}` : ''}
                      </span>
                      {formData.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {formData.category}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold">{formData.title || 'Event Title'}</h4>
                    {formData.description && (
                      <p className="text-gray-600">{formData.description}</p>
                    )}
                    {formData.imageUrl && (
                      <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        Image Preview
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips Card */}
                <div className="mt-4 bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-sm">Tips</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• Use clear, descriptive titles</li>
                    <li>• Add dates for accurate timeline placement</li>
                    <li>• Include media to make cards more engaging</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

