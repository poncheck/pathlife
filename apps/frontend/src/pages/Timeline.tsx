import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryApi } from '../api/client';
import { DiaryEntry } from '../types';
import { formatDate } from '../utils/format';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, Image, Activity } from 'lucide-react';

export function Timeline() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadEntries();
  }, [currentMonth]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = startOfMonth(currentMonth).toISOString();
      const endDate = endOfMonth(currentMonth).toISOString();

      const data = await diaryApi.getEntries(startDate, endDate);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Nie udało się załadować wpisów');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (date: string) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    navigate(`/day/${dateStr}`);
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/day/${today}`);
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Twój Pamiętnik</h1>
        <button
          onClick={handleTodayClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Calendar size={18} />
          Dzisiaj
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Poprzedni miesiąc
        </button>
        <h2 className="text-xl font-semibold">{formatDate(currentMonth, 'LLLL yyyy')}</h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          disabled={currentMonth >= new Date()}
        >
          Następny miesiąc →
        </button>
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Brak wpisów w tym miesiącu
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry.date)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{formatDate(entry.date, 'EEEE, dd MMMM yyyy')}</h3>
                  {entry.description && (
                    <p className="text-gray-600 mt-2 line-clamp-2">{entry.description}</p>
                  )}
                </div>
              </div>

              {/* Summary stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {entry.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Image size={16} />
                    <span>{entry.photos.length} zdjęć</span>
                  </div>
                )}
                {entry.activities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Activity size={16} />
                    <span>{entry.activities.length} aktywności</span>
                  </div>
                )}
              </div>

              {/* Photo preview */}
              {entry.photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {entry.photos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="aspect-square rounded overflow-hidden">
                      <img
                        src={photo.thumbnailUrl || photo.immichUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
