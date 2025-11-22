import { PrismaClient } from '@prisma/client';
import axios from 'axios';
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

  private async resolveAddress(lat: number, lon: number): Promise<string | null> {
    try {
      // Use Nominatim (OpenStreetMap) for reverse geocoding
      // IMPORTANT: Respect Nominatim Usage Policy (User-Agent, 1 request per second)
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon,
          format: 'json',
          zoom: 18,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'PathLife/1.0 (poncheck@example.com)' // Replace with actual contact if possible or keep generic but unique
        }
      });

      if (response.data && response.data.display_name) {
        // Construct a shorter address if possible, or just use display_name
        const addr = response.data.address;
        let shortAddress = response.data.display_name;

        if (addr) {
          // Try to build a cleaner address: City, Country or Town, Country
          const city = addr.city || addr.town || addr.village || addr.hamlet;
          const country = addr.country;
          if (city && country) {
            shortAddress = `${city}, ${country}`;
          }
        }

        return shortAddress;
      }
      return null;
    } catch (error: any) {
      logger.error(`Error resolving address for ${lat}, ${lon}:`, error.message);
      return null;
    }
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

      logger.info(`Fetching nights away for year ${year} (Home: ${homeLat}, ${homeLon})`);

      // 2. Check cache first
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 0, 1));

      const cachedNights = await prisma.nightStay.findMany({
        where: {
          date: {
            gte: format(startDate, 'yyyy-MM-dd'),
            lte: format(endDate, 'yyyy-MM-dd')
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      // If we have cached data for the entire year, return it
      if (cachedNights.length > 0) {
        logger.info(`Returning ${cachedNights.length} cached nights for year ${year}`);
        return cachedNights.map(night => ({
          date: night.date,
          location: {
            latitude: night.latitude,
            longitude: night.longitude,
            address: night.address || 'Unknown Location'
          },
          distanceFromHome: night.distanceFromHome
        }));
      }

      // 3. Calculate nights if not cached
      logger.info(`Calculating nights away for year ${year} (no cache found)`);
      const nightsAway: NightStay[] = [];

      // Fetch all locations for the year
      const locations = await prisma.location.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
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
        const nightLocations = locations.filter((l: any) => l.timestamp >= nightStart && l.timestamp <= nightEnd);

        if (nightLocations.length > 0) {
          // Calculate average position or take the one in the middle
          // Let's take the one with the most occurrences or just average.
          // Simple approach: take the middle point in time.
          const midPoint = nightLocations[Math.floor(nightLocations.length / 2)];

          const distance = this.calculateDistance(homeLat, homeLon, midPoint.latitude, midPoint.longitude);

          if (distance > 1.0) { // 1km threshold
            let address = midPoint.address;

            // Resolve address if missing
            if (!address || address === 'Unknown Location') {
              logger.info(`Resolving address for night at ${midPoint.latitude}, ${midPoint.longitude}`);
              const resolved = await this.resolveAddress(midPoint.latitude, midPoint.longitude);
              if (resolved) {
                address = resolved;
                // Update database
                await prisma.location.update({
                  where: { id: midPoint.id },
                  data: { address: resolved }
                });
                midPoint.address = resolved;

                // Sleep a bit to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            const nightData = {
              date: format(currentDate, 'yyyy-MM-dd'),
              location: {
                latitude: midPoint.latitude,
                longitude: midPoint.longitude,
                address: address || 'Unknown Location'
              },
              distanceFromHome: distance
            };

            nightsAway.push(nightData);

            // Save to cache
            await prisma.nightStay.upsert({
              where: { date: nightData.date },
              update: {
                latitude: midPoint.latitude,
                longitude: midPoint.longitude,
                address: address || 'Unknown Location',
                distanceFromHome: distance
              },
              create: {
                date: nightData.date,
                latitude: midPoint.latitude,
                longitude: midPoint.longitude,
                address: address || 'Unknown Location',
                distanceFromHome: distance
              }
            });
          }
        }

        currentDate = addDays(currentDate, 1);
      }

      logger.info(`Calculated and cached ${nightsAway.length} nights for year ${year}`);
      return nightsAway;

    } catch (error: any) {
      logger.error('Error calculating nights away:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await prisma.nightStay.deleteMany({});
      logger.info('Night stats cache cleared');
    } catch (error: any) {
      logger.error('Error clearing night stats cache:', error);
      throw error;
    }
  }
}

export const nightsService = new NightsService();
