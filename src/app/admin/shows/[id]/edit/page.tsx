"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';

interface ShowFormData {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  location: string;
  image: string;
  humanitixEmbed: string;
  isPast: boolean;
  isPublished: boolean;
}

// Convert ISO date string to datetime-local format
const isoToDatetimeLocal = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
};

// Convert datetime-local format to ISO string
const datetimeLocalToIso = (datetimeLocal: string) => {
  if (!datetimeLocal) return '';
  const date = new Date(datetimeLocal);
  return date.toISOString();
};

export default function EditShow({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ShowFormData>({
    id: '',
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    image: '/hero-image.jpg',
    humanitixEmbed: '',
    isPast: false,
    isPublished: false
  });

  useEffect(() => {
    fetchShow();
  }, [id]);

  const fetchShow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/shows');
      if (response.ok) {
        const data = await response.json();
        const show = data.shows.find((s: any) => s.id === id);
        if (show) {
          setFormData({
            id: show.id,
            title: show.title || '',
            description: show.description || '',
            date: isoToDatetimeLocal(show.date || ''),
            endDate: isoToDatetimeLocal(show.endDate || ''),
            location: show.location || '',
            image: show.image || '/hero-image.jpg',
            humanitixEmbed: show.humanitixEmbed || '',
            isPast: show.isPast || false,
            isPublished: show.isPublished !== false
          });
        } else {
          alert('Show not found');
          router.push('/admin/shows');
        }
      }
    } catch (error) {
      console.error('Error fetching show:', error);
      alert('Failed to fetch show');
      router.push('/admin/shows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert datetime-local back to ISO format for saving
      const submitData = {
        ...formData,
        date: datetimeLocalToIso(formData.date),
        endDate: datetimeLocalToIso(formData.endDate)
      };

      const response = await fetch('/api/admin/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push('/admin/shows');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating show:', error);
      alert('Failed to update show');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading show...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Show</h1>
          <p className="mt-2 text-gray-600">
            Update show details and information
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Show Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter show title"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter show description"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location/Venue *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter venue and address"
              />
            </div>

            {/* Date and Time */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Media and Links */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Media & Links</h2>
            </div>

            <div className="md:col-span-2">
              <ImageUpload
                value={formData.image}
                onChange={(value) => setFormData(prev => ({ ...prev, image: value }))}
                label="Show Image"
                placeholder="/path/to/image.jpg or upload a file"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="humanitixEmbed" className="block text-sm font-medium text-gray-700 mb-2">
                Humanitix Embed Code *
              </label>
              <textarea
                id="humanitixEmbed"
                name="humanitixEmbed"
                value={formData.humanitixEmbed}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="<iframe src='https://events.humanitix.com/your-event' width='100%' height='600' frameborder='0'></iframe>"
              />
              <p className="text-sm text-gray-500 mt-1">
                Paste the full iframe embed code from Humanitix
              </p>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                Published
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPast"
                name="isPast"
                checked={formData.isPast}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isPast" className="ml-2 block text-sm text-gray-900">
                Mark as past event
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/shows')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Show'
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 