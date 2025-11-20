import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { startOfDay, endOfDay } from 'date-fns';
import logger from '../utils/logger';

export interface TraccarPosition {
  id: number;
  deviceId: number;
  protocol: string;
  deviceTime: string;
  fixTime: string;
  serverTime: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  address: string | null;
  accuracy: number;
  valid: boolean;
  attributes: any;
}

export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
  positionId: number;
}

export class TraccarService {
  private client: AxiosInstance;

  constructor() {
    const email = process.env.TRACCAR_EMAIL || '';
    const password = process.env.TRACCAR_PASSWORD || '';

    // Use Basic Authentication - more reliable for Traccar API
    const auth = Buffer.from(`${email}:${password}`).toString('base64');

    this.client = axios.create({
      baseURL: process.env.TRACCAR_URL || '',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      // Disable SSL verification if using self-signed cert
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  async getDevices(): Promise<TraccarDevice[]> {
    try {
      const response = await this.client.get('/api/devices');
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Traccar devices:', error.message);
      throw new Error(`Failed to fetch Traccar devices: ${error.message}`);
    }
  }

  async getPositionsByDate(deviceId: number, date: Date): Promise<TraccarPosition[]> {
    try {
      const from = startOfDay(date).toISOString();
      const to = endOfDay(date).toISOString();

      logger.info(`Fetching Traccar positions for device ${deviceId} on ${date.toISOString()}`);

      const response = await this.client.get('/api/positions', {
        params: {
          deviceId,
          from,
          to,
        },
      });

      logger.info(`Found ${response.data.length} positions from Traccar`);
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Traccar positions:', error.message);
      throw new Error(`Failed to fetch Traccar positions: ${error.message}`);
    }
  }

  async getAllPositionsByDate(date: Date): Promise<TraccarPosition[]> {
    try {
      const devices = await this.getDevices();
      const allPositions: TraccarPosition[] = [];

      for (const device of devices) {
        const positions = await this.getPositionsByDate(device.id, date);
        allPositions.push(...positions);
      }

      return allPositions;
    } catch (error: any) {
      logger.error('Error fetching all Traccar positions:', error.message);
      throw new Error(`Failed to fetch all Traccar positions: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/server');
      logger.info('Traccar connection test successful');
      return !!response.data.id;
    } catch (error: any) {
      logger.error('Traccar connection test failed:', error.message);
      return false;
    }
  }
}
