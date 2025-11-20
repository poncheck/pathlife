import { Router, Request, Response } from 'express';
import { subDays } from 'date-fns';
import { syncService } from '../services/sync.service';
import logger from '../utils/logger';

const router = Router();

// Manually trigger sync for a date range
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate) {
      return res.status(400).json({ error: 'startDate is required' });
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    logger.info(`Manual sync triggered for ${start.toISOString()} to ${end.toISOString()}`);

    // Run sync in background
    syncService.syncDateRange(start, end).catch(error => {
      logger.error('Background sync error:', error);
    });

    res.json({
      message: 'Sync started',
      startDate: start,
      endDate: end,
    });
  } catch (error: any) {
    logger.error('Error starting sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync today
router.post('/sync/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();

    logger.info('Manual sync triggered for today');

    syncService.syncDate(today).catch(error => {
      logger.error('Background sync error:', error);
    });

    res.json({
      message: 'Sync started for today',
      date: today,
    });
  } catch (error: any) {
    logger.error('Error starting sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync last N days
router.post('/sync/last-days/:days', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.params.days);
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    logger.info(`Manual sync triggered for last ${days} days`);

    syncService.syncDateRange(startDate, endDate).catch(error => {
      logger.error('Background sync error:', error);
    });

    res.json({
      message: `Sync started for last ${days} days`,
      startDate,
      endDate,
    });
  } catch (error: any) {
    logger.error('Error starting sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test connections to external services
router.get('/test-connections', async (req: Request, res: Response) => {
  try {
    const results = await syncService.testConnections();

    res.json({
      immich: results.immich ? 'Connected' : 'Failed',
      strava: results.strava ? 'Connected' : 'Failed',
      traccar: results.traccar ? 'Connected' : 'Failed',
    });
  } catch (error: any) {
    logger.error('Error testing connections:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
