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
      setError(err.message || 'Nie udało się załadować wpisów');
    } finally {
      setLoading(false);
    }
  };

  const getYearsAgo = (date: string): number => {
    const entryDate = new Date(date);
    const today = new Date();
    return today.getFullYear() - entryDate.getFullYear();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Ładowanie...</div>
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
          <h1 className="text-3xl font-bold">W tym dniu</h1>
          <p className="text-gray-600 mt-1">Zobacz co robiłeś w poprzednich latach</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Brak wpisów z tego dnia w poprzednich latach
        </div>
      ) : (
        <div className="space-y-8">
          {entries.map((entry) => {
            const yearsAgo = getYearsAgo(entry.date);
            const entryDate = new Date(entry.date).toISOString().split('T')[0];

            return (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/day/${entryDate}`)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock size={24} className="text-blue-600" />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {yearsAgo} {yearsAgo === 1 ? 'rok' : yearsAgo < 5 ? 'lata' : 'lat'} temu
                    </h2>
                    <p className="text-gray-600">{formatDate(entry.date)}</p>
                  </div>
                  <div className="ml-auto text-sm text-blue-600 font-medium">
                    Kliknij aby zobaczyć więcej →
                  </div>
                </div>

                {entry.description && (
                  <div className="mb-6">
                    <p className="text-gray-700 italic">{entry.description}</p>
                  </div>
                )}

                {entry.photos.length > 0 && (
                  <div className="mb-6" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold mb-3">Zdjęcia</h3>
                    <PhotoGallery
                      photos={entry.photos}
                      onToggleSelect={() => {}}
                      editable={false}
                    />
                  </div>
                )}

                {entry.activities.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold mb-3">Aktywności</h3>
                    <ActivityList activities={entry.activities} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
