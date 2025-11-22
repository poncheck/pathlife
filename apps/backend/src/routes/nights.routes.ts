import { Router, Request, Response } from 'express';
import { nightsService } from '../services/nights.service';
import { authMiddleware } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get nights away for a specific year
router.get('/:year', async (req: Request, res: Response) => {
    try {
        const year = parseInt(req.params.year);

        if (isNaN(year)) {
            return res.status(400).json({ error: 'Invalid year format' });
        }

        const nights = await nightsService.getNightsAway(year);
        res.json(nights);
    } catch (error: any) {
        logger.error(`Error getting nights for year ${req.params.year}:`, error);
        res.status(500).json({ error: 'Failed to get nights data' });
    }
});

export default router;
