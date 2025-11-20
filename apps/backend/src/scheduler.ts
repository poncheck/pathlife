import cron from 'node-cron';
import { syncService } from './services/sync.service';
import logger from './utils/logger';

export function initScheduler() {
  const schedule = process.env.SYNC_SCHEDULE || '0 */6 * * *'; // Default: every 6 hours

  logger.info(`Initializing scheduler with schedule: ${schedule}`);

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
