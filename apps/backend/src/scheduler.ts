import cron from 'node-cron';
import { syncService } from './services/sync.service';
import logger from './utils/logger';

export function initScheduler() {
  const schedule = process.env.SYNC_SCHEDULE || '0 */6 * * *'; // Default: every 6 hours

  logger.info(`Initializing scheduler with schedule: ${schedule}`);
  logger.info(`⚠️  Note: Strava API limits: 100 requests/15min, 1000 requests/day`);
  logger.info(`⚠️  Recommended: sync every 6-12 hours to avoid rate limits`);

  // Schedule automatic sync for today
  cron.schedule(schedule, async () => {
    try {
      logger.info('Running scheduled sync for today');
      const today = new Date();
      await syncService.syncDate(today);
      logger.info('Scheduled sync completed successfully');
    } catch (error: any) {
      logger.error('Error in scheduled sync:', error.message);
    }
  });

  logger.info('Scheduler initialized successfully');
}
