import { PrismaClient } from '@prisma/client';
import { settingsService } from './settings.service';
import logger from '../utils/logger';
import { startOfYear, endOfYear, addDays, format, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

export interface NightStay {
  date: string; // YYYY-MM-DD (date of the start of the night)
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distanceFromHome: number; // in km
}

export class NightsService {

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  async getNightsAway(year: number): Promise<NightStay[]> {
    try {
      // 1. Get Home Location from Settings
      const homeLatStr = await settingsService.get('home_latitude');
      const homeLonStr = await settingsService.get('home_longitude');

      if (!homeLatStr || !homeLonStr) {
        logger.warn('Home location not set');
        return [];
      }

      const homeLat = parseFloat(homeLatStr);
      const homeLon = parseFloat(homeLonStr);

      logger.info(`Calculating nights away for year ${year} (Home: ${homeLat}, ${homeLon})`);

      // 2. Iterate through days of the year
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 0, 1));

      const nightsAway: NightStay[] = [];

      // We will look at each night. A night starts on day X at 23:00 and ends on day X+1 at 06:00.
      // We can optimize by fetching all locations for the year and processing in memory, 
      // or fetching day by day. Fetching all might be too heavy if there are many points.
      // But fetching day by day is 365 queries.
      // Let's try to fetch in chunks or just fetch all locations for the year (only id, lat, lon, timestamp) to minimize memory.

      // Actually, let's fetch all locations for the year.
      const locations = await prisma.location.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          latitude: true,
          longitude: true,
          timestamp: true,
          address: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      if (locations.length === 0) {
        return [];
      }

      // Group locations by "Night"
      // A night belongs to the date where it started.
      // e.g. 2023-01-01 23:00 to 2023-01-02 06:00 belongs to 2023-01-01.

      let currentDate = startDate;
      while (currentDate < endDate) {
        const nightStart = setHours(setMinutes(currentDate, 0), 23);
        const nightEnd = setHours(setMinutes(addDays(currentDate, 1), 0), 6);

        // Filter locations in this window
        const nightLocations = locations.filter(l => l.timestamp >= nightStart && l.timestamp <= nightEnd);

        if (nightLocations.length > 0) {
          // Calculate average position or take the one in the middle
          // Let's take the one with the most occurrences or just average.
          // Simple approach: take the middle point in time.
          const midPoint = nightLocations[Math.floor(nightLocations.length / 2)];

          const distance = this.calculateDistance(homeLat, homeLon, midPoint.latitude, midPoint.longitude);

          if (distance > 1.0) { // 1km threshold
            nightsAway.push({
              date: format(currentDate, 'yyyy-MM-dd'),
              location: {
                latitude: midPoint.latitude,
                longitude: midPoint.longitude,
                address: midPoint.address || 'Unknown Location'
              },
              distanceFromHome: distance
            });
          }
        }

        currentDate = addDays(currentDate, 1);
      }

      return nightsAway;

    } catch (error: any) {
      logger.error('Error calculating nights away:', error);
      throw error;
    }
  }
}

export const nightsService = new NightsService();
