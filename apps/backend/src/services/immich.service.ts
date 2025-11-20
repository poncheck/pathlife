import axios, { AxiosInstance } from 'axios';
import { startOfDay, endOfDay } from 'date-fns';
import logger from '../utils/logger';

export interface ImmichAsset {
  id: string;
  deviceAssetId: string;
  ownerId: string;
  deviceId: string;
  type: 'IMAGE' | 'VIDEO';
  originalPath: string;
  resizePath: string | null;
  fileCreatedAt: string;
  fileModifiedAt: string;
  isFavorite: boolean;
  duration: string | null;
  exifInfo?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

export class ImmichService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.IMMICH_URL || '';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': process.env.IMMICH_API_KEY || '',
        'Accept': 'application/json',
      },
    });
  }

  async getAssetsByDate(date: Date): Promise<ImmichAsset[]> {
    try {
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      logger.info(`Fetching Immich assets for date: ${date.toISOString()}`);

      // Search for assets within the date range
      const response = await this.client.post('/api/search/metadata', {
        takenAfter: start,
        takenBefore: end,
      });

      logger.info(`Found ${response.data.assets?.items?.length || 0} assets from Immich`);
      return response.data.assets?.items || [];
    } catch (error: any) {
      logger.error('Error fetching Immich assets:', error.message);
      throw new Error(`Failed to fetch Immich assets: ${error.message}`);
    }
  }

  getAssetThumbnailUrl(assetId: string): string {
    return `${this.baseUrl}/api/asset/thumbnail/${assetId}`;
  }

  getAssetUrl(assetId: string): string {
    return `${this.baseUrl}/api/asset/file/${assetId}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/server-info/ping');
      logger.info('Immich connection test successful');
      return response.data.res === 'pong';
    } catch (error: any) {
      logger.error('Immich connection test failed:', error.message);
      return false;
    }
  }
}
