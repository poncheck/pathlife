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
      // Improved algorithm: check evening (20:00-23:59) and morning (06:00-10:00) locations
      // If both are in same area (within 5km) and >1km from home, count as night away

      let currentDate = startDate;
      while (currentDate < endDate) {
        // Evening window: 20:00-23:59 on current day
        const eveningStart = setHours(setMinutes(currentDate, 0), 20);
        const eveningEnd = setHours(setMinutes(currentDate, 59), 23);

        // Morning window: 06:00-10:00 on next day
        const morningStart = setHours(setMinutes(addDays(currentDate, 1), 0), 6);
        const morningEnd = setHours(setMinutes(addDays(currentDate, 1), 0), 10);

        // Get evening locations
        const eveningLocations = locations.filter((l: any) =>
          l.timestamp >= eveningStart && l.timestamp <= eveningEnd
        );

        // Get morning locations
        const morningLocations = locations.filter((l: any) =>
          l.timestamp >= morningStart && l.timestamp <= morningEnd
        );

        // Need at least one location in either evening or morning
        if (eveningLocations.length > 0 || morningLocations.length > 0) {
          // Get representative points
          let eveningPoint = null;
          let morningPoint = null;

          if (eveningLocations.length > 0) {
            const candidate = eveningLocations[Math.floor(eveningLocations.length / 2)];
            const distanceFromHome = this.calculateDistance(homeLat, homeLon, candidate.latitude, candidate.longitude);
            // Only use if away from home (>1km)
            if (distanceFromHome > 1.0) {
              eveningPoint = candidate;
            }
          }

          if (morningLocations.length > 0) {
            const candidate = morningLocations[Math.floor(morningLocations.length / 2)];
            const distanceFromHome = this.calculateDistance(homeLat, homeLon, candidate.latitude, candidate.longitude);
            // Only use if away from home (>1km)
            if (distanceFromHome > 1.0) {
              morningPoint = candidate;
            }
          }

          // If both evening and morning are at home, skip this night
          if (!eveningPoint && !morningPoint) {
            currentDate = addDays(currentDate, 1);
            continue;
          }

          // Determine the location to use
          let nightLocation = null;

          if (eveningPoint && morningPoint) {
            // Both available - check if they're in same area (within 5km)
            const distanceBetween = this.calculateDistance(
              eveningPoint.latitude, eveningPoint.longitude,
              morningPoint.latitude, morningPoint.longitude
            );

            if (distanceBetween <= 5.0) {
              // Same area - use evening point (more likely to be sleeping location)
              nightLocation = eveningPoint;
            } else {
              // Different areas - skip this night (person was traveling)
              currentDate = addDays(currentDate, 1);
              continue;
            }
          } else {
            // Only one available - use it
            nightLocation = eveningPoint || morningPoint;
          }

          if (nightLocation) {
            const distance = this.calculateDistance(homeLat, homeLon, nightLocation.latitude, nightLocation.longitude);

            if (distance > 1.0) { // 1km threshold
              let address = nightLocation.address;

              // Resolve address if missing
              if (!address || address === 'Unknown Location') {
                logger.info(`Resolving address for night at ${nightLocation.latitude}, ${nightLocation.longitude}`);
                const resolved = await this.resolveAddress(nightLocation.latitude, nightLocation.longitude);
                if (resolved) {
                  address = resolved;
                  // Update database
                  await prisma.location.update({
                    where: { id: nightLocation.id },
                    data: { address: resolved }
                  });
                  nightLocation.address = resolved;

                  // Sleep a bit to respect rate limits
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }

              const nightData = {
                date: format(currentDate, 'yyyy-MM-dd'),
                location: {
                  latitude: nightLocation.latitude,
                  longitude: nightLocation.longitude,
                  address: address || 'Unknown Location'
                },
                distanceFromHome: distance
              };

              nightsAway.push(nightData);

              // Save to cache
              await prisma.nightStay.upsert({
                where: { date: nightData.date },
                update: {
                  latitude: nightLocation.latitude,
                  longitude: nightLocation.longitude,
                  address: address || 'Unknown Location',
                  distanceFromHome: distance
                },
                create: {
                  date: nightData.date,
                  latitude: nightLocation.latitude,
                  longitude: nightLocation.longitude,
                  address: address || 'Unknown Location',
                  distanceFromHome: distance
                }
              });
            }
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
