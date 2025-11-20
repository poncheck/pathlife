import axios, { AxiosInstance } from 'axios';
import { startOfDay, endOfDay, format } from 'date-fns';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  map: {
    summary_polyline?: string;
  };
  average_speed: number;
  max_speed: number;
}

export class StravaService {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.strava.com/api/v3',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: process.env.STRAVA_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
      logger.info('Strava access token refreshed successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error('Error refreshing Strava token:', error.message);
      throw new Error(`Failed to refresh Strava token: ${error.message}`);
    }
  }

  private async ensureAuthenticated() {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  async getActivitiesByDate(date: Date): Promise<StravaActivity[]> {
    try {
      await this.ensureAuthenticated();

      const after = Math.floor(startOfDay(date).getTime() / 1000);
      const before = Math.floor(endOfDay(date).getTime() / 1000);

      logger.info(`Fetching Strava activities for date: ${date.toISOString()}`);

      const response = await this.client.get('/athlete/activities', {
        params: {
          after,
          before,
          per_page: 50,
        },
      });

      logger.info(`Found ${response.data.length} activities from Strava`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, refresh and retry
        await this.refreshAccessToken();
        return this.getActivitiesByDate(date);
      }
      logger.error('Error fetching Strava activities:', error.message);
      throw new Error(`Failed to fetch Strava activities: ${error.message}`);
    }
  }

  async getActivityDetails(activityId: number): Promise<StravaActivity> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/activities/${activityId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching Strava activity ${activityId}:`, error.message);
      throw new Error(`Failed to fetch Strava activity: ${error.message}`);
    }
  }

  /**
   * Download GPX file for an activity and save it locally
   * @param activityId Strava activity ID
   * @param activityName Name of the activity for the filename
   * @returns Path to the saved GPX file
   */
  async downloadActivityGpx(activityId: number, activityName: string = ''): Promise<string> {
    try {
      await this.ensureAuthenticated();

      logger.info(`Downloading GPX for Strava activity ${activityId}`);

      // Download GPX from Strava
      const response = await this.client.get(`/activities/${activityId}/export_gpx`, {
        responseType: 'text',
      });

      // Create GPX directory if it doesn't exist
      const gpxDir = path.join(process.cwd(), 'data', 'gpx', 'strava');
      await fs.mkdir(gpxDir, { recursive: true });

      // Generate filename
      const safeName = activityName
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 50);
      const filename = safeName
        ? `${activityId}-${safeName}.gpx`
        : `${activityId}.gpx`;
      const filePath = path.join(gpxDir, filename);

      // Save GPX file
      await fs.writeFile(filePath, response.data, 'utf-8');

      logger.info(`Saved GPX file: ${filePath}`);
      return filePath;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`GPX not available for activity ${activityId} (may not have GPS data)`);
        throw new Error('GPX not available for this activity');
      }
      logger.error(`Error downloading GPX for activity ${activityId}:`, error.message);
      throw new Error(`Failed to download GPX: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      const response = await this.client.get('/athlete');
      logger.info('Strava connection test successful');
      return !!response.data.id;
    } catch (error: any) {
      logger.error('Strava connection test failed:', error.message);
      return false;
    }
  }
}
