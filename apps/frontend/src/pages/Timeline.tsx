import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryApi } from '../api/client';
import { DiaryEntry } from '../types';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parse,
  isValid
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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

      // Load entries for the entire calendar view (including days from prev/next month)
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      const data = await diaryApi.getEntries(
        calendarStart.toISOString(),
        calendarEnd.toISOString()
      );
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // Find entry for a specific date
  const getEntryForDate = (date: Date): DiaryEntry | undefined => {
    return entries.find(entry =>
      isSameDay(new Date(entry.date), date)
    );
  };

  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    navigate(`/day/${dateStr}`);
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/day/${today}`);
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const calendarDays = getCalendarDays();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleDateJump = (dateString: string) => {
    if (!dateString) return;

    const selectedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(selectedDate)) {
      setCurrentMonth(selectedDate);
    }
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
  };

  // Generate array of years from earliest possible year to current year
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 1980; // Can adjust based on your oldest data
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Diary</h1>
        <div className="flex items-center gap-3">
          <select
            value={currentMonth.getFullYear()}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors bg-white"
            title="Select year"
          >
            {generateYearOptions().map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <input
            type="date"
            onChange={(e) => handleDateJump(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            max={new Date().toISOString().split('T')[0]}
            title="Jump to date"
          />
          <button
            onClick={handleTodayClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calendar size={18} />
            Today
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Month and Year selector */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {/* Previous year */}
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 12))}
          className="p-3 bg-white rounded-lg hover:bg-gray-100 shadow-sm transition-colors"
          aria-label="Previous year"
          title="Previous year"
        >
          <ChevronsLeft size={24} />
        </button>

        {/* Previous month */}
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-3 bg-white rounded-lg hover:bg-gray-100 shadow-sm transition-colors"
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft size={24} />
        </button>

        <h2 className="text-2xl font-semibold min-w-[250px] text-center">
          {format(currentMonth, 'LLLL yyyy', { locale: enUS })}
        </h2>

        {/* Next month */}
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-3 bg-white rounded-lg hover:bg-gray-100 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentMonth >= new Date()}
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight size={24} />
        </button>

        {/* Next year */}
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 12))}
          className="p-3 bg-white rounded-lg hover:bg-gray-100 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentMonth >= new Date()}
          aria-label="Next year"
          title="Next year"
        >
          <ChevronsRight size={24} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-600 text-sm md:text-base py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const entry = getEntryForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const hasPhotos = entry && entry.photos.length > 0;
            const hasActivities = entry && entry.activities.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square p-2 rounded-lg transition-all relative
                  ${isCurrentMonth
                    ? 'bg-gray-50 hover:bg-blue-50 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }
                  ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`text-sm md:text-base font-medium ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>

                  {/* Indicators for photos and activities */}
                  {(hasPhotos || hasActivities) && (
                    <div className="flex gap-1 mt-1">
                      {hasPhotos && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Photos" />
                      )}
                      {hasActivities && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Activities" />
                      )}
                    </div>
                  )}

                  {/* Photo count badge for days with many photos */}
                  {hasPhotos && entry.photos.length > 5 && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {entry.photos.length}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Photos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Activities</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded ring-2 ring-blue-500" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
