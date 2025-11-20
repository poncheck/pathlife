import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diaryApi, syncApi } from '../api/client';
import { DiaryEntry } from '../types';
import { PhotoGallery } from '../components/PhotoGallery';
import { ActivityList } from '../components/ActivityList';
import { LocationMap } from '../components/LocationMap';
import { formatDate } from '../utils/format';
import { ChevronLeft, ChevronRight, Save, Calendar, RefreshCw } from 'lucide-react';

export function DailyView() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [date]);

  const loadEntry = async () => {
    if (!date) return;

    try {
      setLoading(true);
      setError(null);
      const data = await diaryApi.getEntry(date);
      setEntry(data);
      setDescription(data.description || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!date) return;

    try {
      setSaving(true);
      await diaryApi.updateDescription(date, description);
      await loadEntry();
    } catch (err: any) {
      setError(err.message || 'Failed to save description');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePhoto = async (photoId: string) => {
    try {
      await diaryApi.togglePhoto(photoId);
      await loadEntry();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle photo selection');
    }
  };

  const navigateDate = (offset: number) => {
    if (!date) return;
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + offset);
    navigate(`/day/${currentDate.toISOString().split('T')[0]}`);
  };

  const handleSyncDay = async () => {
    if (!date) return;

    try {
      setSyncing(true);
      setError(null);
      await syncApi.sync(date, date);

      // Wait a bit for sync to complete
      setTimeout(async () => {
        await loadEntry();
        setSyncing(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to synchronize data');
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">No entry for this date</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold">{formatDate(entry.date)}</h1>
          <div className="flex items-center gap-4 justify-center mt-2">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Calendar size={16} />
              Show calendar
            </button>
            <button
              onClick={handleSyncDay}
              disabled={syncing}
              className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 disabled:text-gray-400"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Synchronizing...' : 'Synchronize data'}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigateDate(1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Info banner when no data */}
      {entry.photos.length === 0 && entry.activities.length === 0 && entry.locations.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-yellow-800">
            No data for this day. Click "Synchronize data" to fetch photos from Immich, activities from Strava, and locations from Traccar.
          </p>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <label className="block text-lg font-semibold mb-2">Day description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Add description for this day..."
        />
        <button
          onClick={handleSaveDescription}
          disabled={saving}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Photos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Photos ({entry.photos.length})
        </h2>
        <PhotoGallery
          photos={entry.photos}
          onToggleSelect={handleTogglePhoto}
          editable={true}
        />
      </div>

      {/* Activities */}
      {entry.activities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Activities ({entry.activities.length})
          </h2>
          <ActivityList activities={entry.activities} />
        </div>
      )}

      {/* Map */}
      {entry.locations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Map ({entry.locations.length} points)
          </h2>
          <LocationMap locations={entry.locations} />
        </div>
      )}
    </div>
  );
}
