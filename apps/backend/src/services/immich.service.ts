import axios, { AxiosInstance } from 'axios';
import { startOfDay, endOfDay } from 'date-fns';
import logger from '../utils/logger';
import { settingsService } from './settings.service';

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
  private client: AxiosInstance | null = null;
  private baseUrl: string = '';

  constructor() {
    // Client will be initialized on first use
  }

  private async ensureConfigured(): Promise<void> {
    if (this.client) return;

    // Try to get from Settings first
    const settings = await settingsService.getServiceConfig('immich');

    const url = settings['immich_url'] || process.env.IMMICH_URL || '';
    const apiKey = settings['immich_api_key'] || process.env.IMMICH_API_KEY || '';

    if (!url || !apiKey) {
      throw new Error('Immich configuration is incomplete. Please configure in Settings.');
    }

    this.baseUrl = url;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    logger.info('Immich service configured');
  }

  async getAssetsByDate(date: Date): Promise<ImmichAsset[]> {
    await this.ensureConfigured();
    try {
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      logger.info(`Fetching Immich assets for date: ${date.toISOString()}`);

      // Search for assets within the date range
      const response = await this.client!.post('/api/search/metadata', {
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
    // Return local proxy URL instead of direct Immich URL
    return `/api/immich/thumbnail/${assetId}`;
  }

  getAssetUrl(assetId: string): string {
    // Return local proxy URL instead of direct Immich URL
    return `/api/immich/asset/${assetId}`;
  }

  async fetchAssetThumbnail(assetId: string): Promise<Buffer> {
    await this.ensureConfigured();
    // Updated endpoint for Immich v1.x+
    const response = await this.client!.get(`/api/assets/${assetId}/thumbnail`, {
      responseType: 'arraybuffer',
      params: {
        size: 'preview', // or 'thumbnail' for smaller size
      },
    });
    return Buffer.from(response.data);
  }

  async fetchAsset(assetId: string): Promise<Buffer> {
    await this.ensureConfigured();
    // Updated endpoint for Immich v1.x+
    const response = await this.client!.get(`/api/assets/${assetId}/original`, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureConfigured();
      const response = await this.client!.get('/api/server-info/ping');
      logger.info('Immich connection test successful');
      return response.data.res === 'pong';
    } catch (error: any) {
      logger.error('Immich connection test failed:', error.message);
      return false;
    }
  }
}
