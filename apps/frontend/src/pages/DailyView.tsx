import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diaryApi } from '../api/client';
import { DiaryEntry } from '../types';
import { PhotoGallery } from '../components/PhotoGallery';
import { ActivityList } from '../components/ActivityList';
import { LocationMap } from '../components/LocationMap';
import { formatDate } from '../utils/format';
import { ChevronLeft, ChevronRight, Save, Calendar } from 'lucide-react';

export function DailyView() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setError(err.message || 'Nie udało się załadować wpisu');
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
      setError(err.message || 'Nie udało się zapisać opisu');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePhoto = async (photoId: string) => {
    try {
      await diaryApi.togglePhoto(photoId);
      await loadEntry();
    } catch (err: any) {
      setError(err.message || 'Nie udało się zmienić wyboru zdjęcia');
    }
  };

  const navigateDate = (offset: number) => {
    if (!date) return;
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + offset);
    navigate(`/day/${currentDate.toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Ładowanie...</div>
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
        <div className="text-xl text-gray-600">Brak wpisu dla tej daty</div>
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
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 mx-auto"
          >
            <Calendar size={16} />
            Pokaż kalendarz
          </button>
        </div>

        <button
          onClick={() => navigateDate(1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Description */}
      <div className="mb-8">
        <label className="block text-lg font-semibold mb-2">Opis dnia</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Dodaj opis tego dnia..."
        />
        <button
          onClick={handleSaveDescription}
          disabled={saving}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>

      {/* Photos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Zdjęcia ({entry.photos.length})
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
            Aktywności ({entry.activities.length})
          </h2>
          <ActivityList activities={entry.activities} />
        </div>
      )}

      {/* Map */}
      {entry.locations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Mapa ({entry.locations.length} punktów)
          </h2>
          <LocationMap locations={entry.locations} />
        </div>
      )}
    </div>
  );
}
