import { Router, Request, Response } from 'express';
import { settingsService } from '../services/settings.service';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

// All settings routes require authentication
router.use(authMiddleware);

// Get all settings keys (without values for security)
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getAllKeys();
    res.json(settings);
  } catch (error: any) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Get settings by type (with decrypted values)
router.get('/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const settings = await settingsService.getByType(type);
    res.json(settings);
  } catch (error: any) {
    logger.error('Get settings by type error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update single setting
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, type } = req.body;

    if (!value || !type) {
      return res.status(400).json({ error: 'Value and type are required' });
    }

    await settingsService.set(key, value, type);

    // Clear night stats cache if home location changed
    if (key === 'home_latitude' || key === 'home_longitude' || key === 'home_address') {
      const { nightsService } = await import('../services/nights.service');
      await nightsService.clearCache();
      logger.info('Night stats cache cleared due to home location change');
    }

    res.json({ message: 'Setting updated successfully' });
  } catch (error: any) {
    logger.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Update multiple settings at once
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    await settingsService.updateMultiple(settings);

    // Clear night stats cache if home location changed
    const homeLocationKeys = ['home_latitude', 'home_longitude', 'home_address'];
    const hasHomeLocationChange = settings.some((s: any) => homeLocationKeys.includes(s.key));

    if (hasHomeLocationChange) {
      const { nightsService } = await import('../services/nights.service');
      await nightsService.clearCache();
      logger.info('Night stats cache cleared due to home location change');
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    logger.error('Bulk update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete setting (admin only)
router.delete('/:key', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    await settingsService.delete(key);
    res.json({ message: 'Setting deleted successfully' });
  } catch (error: any) {
    logger.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

export default router;
