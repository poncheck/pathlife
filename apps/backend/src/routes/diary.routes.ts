import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, subYears, format } from 'date-fns';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get diary entry for a specific date
router.get('/entries/:date', async (req: Request, res: Response) => {
  try {
    const date = startOfDay(new Date(req.params.date));

    let entry = await prisma.diaryEntry.findUnique({
      where: { date },
      include: {
        photos: {
          orderBy: { takenAt: 'asc' },
        },
        activities: {
          orderBy: { startDate: 'asc' },
        },
        locations: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Create empty entry if it doesn't exist
    if (!entry) {
      logger.info(`Creating empty diary entry for ${date.toISOString()}`);
      entry = await prisma.diaryEntry.create({
        data: { date },
        include: {
          photos: true,
          activities: true,
          locations: true,
        },
      });
    }

    res.json(entry);
  } catch (error: any) {
    logger.error('Error fetching diary entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get entries for a date range
router.get('/entries', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const entries = await prisma.diaryEntry.findMany({
      where: {
        date: {
          gte: startOfDay(new Date(startDate as string)),
          lte: startOfDay(new Date(endDate as string)),
        },
      },
      include: {
        photos: {
          take: 3,
          orderBy: { takenAt: 'asc' },
        },
        activities: {
          take: 3,
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: {
            photos: true,
            activities: true,
            locations: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(entries);
  } catch (error: any) {
    logger.error('Error fetching diary entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get "On this day" entries (same day from previous years)
router.get('/on-this-day/:date', async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date);
    const dayMonth = format(date, 'MM-dd');

    // Get entries from previous years on the same day
    const entries = await prisma.diaryEntry.findMany({
      where: {
        date: {
          lt: startOfDay(date),
        },
      },
      include: {
        photos: true,  // Get all photos, not just selected ones
        activities: true,
        locations: true,  // Include Traccar locations
      },
      orderBy: { date: 'desc' },
    });

    // Filter entries that match the same month and day
    const onThisDayEntries = entries.filter((entry: any) => {
      const entryDayMonth = format(entry.date, 'MM-dd');
      return entryDayMonth === dayMonth;
    });

    res.json(onThisDayEntries);
  } catch (error: any) {
    logger.error('Error fetching on-this-day entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update diary entry description
router.patch('/entries/:date', async (req: Request, res: Response) => {
  try {
    const date = startOfDay(new Date(req.params.date));
    const { description } = req.body;

    const entry = await prisma.diaryEntry.update({
      where: { date },
      data: { description },
    });

    res.json(entry);
  } catch (error: any) {
    logger.error('Error updating diary entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle photo selection
router.patch('/photos/:photoId/toggle', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: { selected: !photo.selected },
    });

    res.json(updatedPhoto);
  } catch (error: any) {
    logger.error('Error toggling photo selection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sync logs
router.get('/sync-logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json(logs);
  } catch (error: any) {
    logger.error('Error fetching sync logs:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
