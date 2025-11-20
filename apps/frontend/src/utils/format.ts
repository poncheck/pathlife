import { format, formatDistance, formatDuration, intervalToDuration } from 'date-fns';
import { pl } from 'date-fns/locale';

export const formatDate = (date: string | Date, formatStr: string = 'dd MMMM yyyy'): string => {
  return format(new Date(date), formatStr, { locale: pl });
};

export const formatTime = (date: string | Date): string => {
  return format(new Date(date), 'HH:mm', { locale: pl });
};

export const formatRelative = (date: string | Date): string => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: pl });
};

export const formatDurationSeconds = (seconds: number): string => {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });

  const parts: string[] = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}min`);
  if (duration.seconds && !duration.hours) parts.push(`${duration.seconds}s`);

  return parts.join(' ') || '0s';
};

export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

export const formatSpeed = (metersPerSecond: number): string => {
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

export const formatElevation = (meters: number): string => {
  return `${meters.toFixed(0)} m`;
};

export const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Walk: '🚶',
    Hike: '🥾',
    Swim: '🏊',
    Workout: '💪',
    Yoga: '🧘',
    default: '🏃',
  };
  return icons[type] || icons.default;
};
