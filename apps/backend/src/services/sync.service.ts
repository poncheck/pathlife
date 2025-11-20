import { PrismaClient } from '@prisma/client';
import { startOfDay, format } from 'date-fns';
import { ImmichService } from './immich.service';
import { StravaService } from './strava.service';
import { TraccarService } from './traccar.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class SyncService {
  private immichService: ImmichService;
  private stravaService: StravaService;
  private traccarService: TraccarService;

  constructor() {
    this.immichService = new ImmichService();
    this.stravaService = new StravaService();
    this.traccarService = new TraccarService();
  }

  async syncDateRange(startDate: Date, endDate: Date): Promise<void> {
    logger.info(`Starting sync for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      await this.syncDate(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.info('Sync completed for date range');
  }

  async syncDate(date: Date): Promise<void> {
    const dateKey = startOfDay(date);
    logger.info(`Syncing data for date: ${format(dateKey, 'yyyy-MM-dd')}`);

    try {
      // Get or create diary entry for this date
      let diaryEntry = await prisma.diaryEntry.findUnique({
        where: { date: dateKey },
      });

      if (!diaryEntry) {
        diaryEntry = await prisma.diaryEntry.create({
          data: { date: dateKey },
        });
      }

      // Sync photos from Immich
      await this.syncPhotos(diaryEntry.id, date);

      // Sync activities from Strava
      await this.syncActivities(diaryEntry.id, date);

      // Sync locations from Traccar
      await this.syncLocations(diaryEntry.id, date);

      logger.info(`Successfully synced data for ${format(dateKey, 'yyyy-MM-dd')}`);
    } catch (error: any) {
      logger.error(`Error syncing date ${format(dateKey, 'yyyy-MM-dd')}:`, error.message);
      throw error;
    }
  }

  private async syncPhotos(diaryEntryId: string, date: Date): Promise<void> {
    try {
      const assets = await this.immichService.getAssetsByDate(date);

      for (const asset of assets) {
        // Check if photo already exists
        const existingPhoto = await prisma.photo.findUnique({
          where: { immichId: asset.id },
        });

        if (!existingPhoto) {
          await prisma.photo.create({
            data: {
              immichId: asset.id,
              immichUrl: this.immichService.getAssetUrl(asset.id),
              thumbnailUrl: this.immichService.getAssetThumbnailUrl(asset.id),
              takenAt: new Date(asset.fileCreatedAt),
              diaryEntryId,
              selected: false,
              metadata: JSON.stringify({
                type: asset.type,
                isFavorite: asset.isFavorite,
                exifInfo: asset.exifInfo,
              }),
            },
          });
        }
      }

      await prisma.syncLog.create({
        data: {
          source: 'immich',
          status: 'success',
          itemCount: assets.length,
          message: `Synced ${assets.length} photos`,
        },
      });

      logger.info(`Synced ${assets.length} photos from Immich`);
    } catch (error: any) {
      await prisma.syncLog.create({
        data: {
          source: 'immich',
          status: 'error',
          message: error.message,
        },
      });
      logger.error('Error syncing photos:', error.message);
    }
  }

  private async syncActivities(diaryEntryId: string, date: Date): Promise<void> {
    try {
      const activities = await this.stravaService.getActivitiesByDate(date);

      for (const activity of activities) {
        // Check if activity already exists
        const existingActivity = await prisma.activity.findUnique({
          where: { stravaId: activity.id.toString() },
        });

        if (!existingActivity) {
          await prisma.activity.create({
            data: {
              stravaId: activity.id.toString(),
              name: activity.name,
              type: activity.type,
              distance: activity.distance,
              movingTime: activity.moving_time,
              elapsedTime: activity.elapsed_time,
              totalElevation: activity.total_elevation_gain,
              startDate: new Date(activity.start_date),
              endDate: new Date(activity.start_date),
              polyline: activity.map?.summary_polyline,
              diaryEntryId,
              metadata: JSON.stringify({
                averageSpeed: activity.average_speed,
                maxSpeed: activity.max_speed,
                timezone: activity.timezone,
              }),
            },
          });
        }
      }

      await prisma.syncLog.create({
        data: {
          source: 'strava',
          status: 'success',
          itemCount: activities.length,
          message: `Synced ${activities.length} activities`,
        },
      });

      logger.info(`Synced ${activities.length} activities from Strava`);
    } catch (error: any) {
      await prisma.syncLog.create({
        data: {
          source: 'strava',
          status: 'error',
          message: error.message,
        },
      });
      logger.error('Error syncing activities:', error.message);
    }
  }

  private async syncLocations(diaryEntryId: string, date: Date): Promise<void> {
    try {
      const positions = await this.traccarService.getAllPositionsByDate(date);

      for (const position of positions) {
        // Check if location already exists
        const existingLocation = await prisma.location.findFirst({
          where: {
            traccarId: position.id.toString(),
            diaryEntryId,
          },
        });

        if (!existingLocation) {
          await prisma.location.create({
            data: {
              traccarId: position.id.toString(),
              latitude: position.latitude,
              longitude: position.longitude,
              address: position.address,
              timestamp: new Date(position.fixTime),
              speed: position.speed,
              altitude: position.altitude,
              diaryEntryId,
              metadata: JSON.stringify({
                deviceId: position.deviceId,
                accuracy: position.accuracy,
                valid: position.valid,
              }),
            },
          });
        }
      }

      await prisma.syncLog.create({
        data: {
          source: 'traccar',
          status: 'success',
          itemCount: positions.length,
          message: `Synced ${positions.length} locations`,
        },
      });

      logger.info(`Synced ${positions.length} locations from Traccar`);
    } catch (error: any) {
      await prisma.syncLog.create({
        data: {
          source: 'traccar',
          status: 'error',
          message: error.message,
        },
      });
      logger.error('Error syncing locations:', error.message);
    }
  }

  async testConnections(): Promise<{
    immich: boolean;
    strava: boolean;
    traccar: boolean;
  }> {
    const results = {
      immich: false,
      strava: false,
      traccar: false,
    };

    try {
      results.immich = await this.immichService.testConnection();
    } catch (error) {
      logger.error('Immich test failed');
    }

    try {
      results.strava = await this.stravaService.testConnection();
    } catch (error) {
      logger.error('Strava test failed');
    }

    try {
      results.traccar = await this.traccarService.testConnection();
    } catch (error) {
      logger.error('Traccar test failed');
    }

    return results;
  }
}

export const syncService = new SyncService();
