import { Router } from 'express';
import { ipfsService } from '../services/ipfsService.js';

const router = Router();

/**
 * POST /api/ipfs/upload
 * Upload encrypted data to IPFS
 */
router.post('/upload', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Data is required and must be a string',
      });
    }

    const cid = await ipfsService.upload(data);

    res.json({
      success: true,
      data: {
        cid,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to IPFS',
    });
  }
});

/**
 * GET /api/ipfs/download/:cid
 * Download data from IPFS by CID
 */
router.get('/download/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID is required',
      });
    }

    const data = await ipfsService.download(cid);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error downloading from IPFS:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download from IPFS',
    });
  }
});

/**
 * GET /api/ipfs/status/:cid
 * Get status of a file in IPFS
 */
router.get('/status/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID is required',
      });
    }

    const status = await ipfsService.getStatus(cid);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error checking IPFS status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check IPFS status',
    });
  }
});

export default router;
