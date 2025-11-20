import { Activity } from '../types';
import { formatDurationSeconds, formatDistance, formatElevation, getActivityIcon, formatTime } from '../utils/format';
import { Clock, TrendingUp, MapPin } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activities from this day
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">{getActivityIcon(activity.type)}</div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{activity.name}</h3>
                  <p className="text-sm text-gray-600">{activity.type}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTime(activity.startDate)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4">
                {activity.distance && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-gray-500" />
                    <span>{formatDistance(activity.distance)}</span>
                  </div>
                )}

                {activity.movingTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-500" />
                    <span>{formatDurationSeconds(activity.movingTime)}</span>
                  </div>
                )}

                {activity.totalElevation && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-gray-500" />
                    <span>{formatElevation(activity.totalElevation)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
