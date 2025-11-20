import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { startOfDay, endOfDay, format } from 'date-fns';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';
import { GpxGenerator, GpxPoint } from '../utils/gpx-generator';

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

  /**
   * Generate GPX file from Traccar positions for a specific date
   * @param date Date to generate GPX for
   * @returns Path to the saved GPX file, or null if no positions found
   */
  async generateDailyGpx(date: Date): Promise<string | null> {
    try {
      logger.info(`Generating GPX for Traccar data on ${format(date, 'yyyy-MM-dd')}`);

      // Get all positions for the date
      const positions = await this.getAllPositionsByDate(date);

      if (positions.length === 0) {
        logger.info('No positions found, skipping GPX generation');
        return null;
      }

      // Convert Traccar positions to GPX points
      const gpxPoints: GpxPoint[] = positions.map(pos => ({
        latitude: pos.latitude,
        longitude: pos.longitude,
        timestamp: new Date(pos.fixTime),
        elevation: pos.altitude || undefined,
        speed: pos.speed || undefined,
      }));

      // Generate GPX content
      const trackName = `Traccar Track - ${format(date, 'yyyy-MM-dd')}`;
      const gpxContent = GpxGenerator.generateFromPoints(gpxPoints, trackName);

      // Create GPX directory if it doesn't exist
      const gpxDir = path.join(process.cwd(), 'data', 'gpx', 'traccar');
      await fs.mkdir(gpxDir, { recursive: true });

      // Save GPX file
      const filename = GpxGenerator.getSafeFilename(date, 'traccar');
      const filePath = path.join(gpxDir, filename);
      await fs.writeFile(filePath, gpxContent, 'utf-8');

      logger.info(`Saved Traccar GPX file: ${filePath} (${positions.length} points)`);
      return filePath;
    } catch (error: any) {
      logger.error(`Error generating Traccar GPX:`, error.message);
      throw new Error(`Failed to generate Traccar GPX: ${error.message}`);
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
