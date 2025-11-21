import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryApi } from '../api/client';
import { DiaryEntry } from '../types';
import { formatDate } from '../utils/format';
import { PhotoGallery } from '../components/PhotoGallery';
import { ActivityList } from '../components/ActivityList';
import { ArrowLeft, Clock } from 'lucide-react';

export function OnThisDay() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOnThisDayEntries();
  }, []);

  const loadOnThisDayEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString();
      const data = await diaryApi.getOnThisDay(today);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const getYearsAgo = (date: string): number => {
    const entryDate = new Date(date);
    const today = new Date();
    return today.getFullYear() - entryDate.getFullYear();
  };

  // Check if entry has any content worth displaying
  const hasContent = (entry: DiaryEntry): boolean => {
    return !!(
      entry.description ||
      entry.photos.length > 0 ||
      entry.activities.length > 0 ||
      entry.locations.length > 0
    );
  };

  // Add token to image URLs for authentication
  const addTokenToUrl = (url: string): string => {
    const token = localStorage.getItem('authToken');
    if (!token || !url) return url;

    // Only add token to our API URLs, not external ones
    if (url.startsWith('/api/immich/')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}token=${encodeURIComponent(token)}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">On This Day</h1>
          <p className="text-gray-600 mt-1">See what you did in previous years</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {entries.filter(hasContent).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No entries from this day in previous years
        </div>
      ) : (
        <div className="space-y-8">
          {entries.filter(hasContent).map((entry) => {
            const yearsAgo = getYearsAgo(entry.date);
            const entryDate = new Date(entry.date).toISOString().split('T')[0];
            const backgroundPhoto = entry.photos.length > 0 ? entry.photos[0] : null;

            return (
              <div
                key={entry.id}
                className="relative rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/day/${entryDate}`)}
              >
                {/* Background image if available */}
                {backgroundPhoto && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${addTokenToUrl(backgroundPhoto.thumbnailUrl || backgroundPhoto.immichUrl)})`,
                      }}
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
                  </>
                )}

                {/* Content */}
                <div className={`relative p-6 ${backgroundPhoto ? 'text-white' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Clock size={24} className={backgroundPhoto ? 'text-blue-300' : 'text-blue-600'} />
                    <div>
                      <h2 className="text-2xl font-bold">
                        {yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} ago
                      </h2>
                      <p className={backgroundPhoto ? 'text-gray-200' : 'text-gray-600'}>
                        {formatDate(entry.date)}
                      </p>
                    </div>
                    <div className={`ml-auto text-sm font-medium ${backgroundPhoto ? 'text-blue-300' : 'text-blue-600'}`}>
                      Click to see more →
                    </div>
                  </div>

                  {entry.description && (
                    <div className="mb-6">
                      <p className={`italic ${backgroundPhoto ? 'text-gray-100' : 'text-gray-700'}`}>
                        {entry.description}
                      </p>
                    </div>
                  )}

                  {entry.photos.length > 0 && (
                    <div className="mb-6" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-lg font-semibold mb-3">Photos</h3>
                      <PhotoGallery
                        photos={entry.photos}
                        onToggleSelect={() => {}}
                        editable={false}
                      />
                    </div>
                  )}

                  {entry.activities.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-lg font-semibold mb-3">Activities</h3>
                      <ActivityList activities={entry.activities} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
