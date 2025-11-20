import { Router, Request, Response } from 'express';
import { ImmichService } from '../services/immich.service';
import logger from '../utils/logger';

const router = Router();
const immichService = new ImmichService();

// Proxy endpoint for Immich thumbnails
router.get('/thumbnail/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const imageBuffer = await immichService.fetchAssetThumbnail(assetId);

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(imageBuffer);
  } catch (error: any) {
    logger.error(`Error fetching thumbnail ${req.params.assetId}:`, error.message);
    res.status(404).send('Image not found');
  }
});

// Proxy endpoint for Immich full assets
router.get('/asset/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const imageBuffer = await immichService.fetchAsset(assetId);

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(imageBuffer);
  } catch (error: any) {
    logger.error(`Error fetching asset ${req.params.assetId}:`, error.message);
    res.status(404).send('Image not found');
  }
});

export default router;
