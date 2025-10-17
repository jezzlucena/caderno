import { Router } from 'express';
import { UserModel } from '../models/user.js';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new API key
 */
router.post('/register', (req, res) => {
  try {
    const { user, plainApiKey } = UserModel.create();
    console.log('New user created with ID:', user.id);
    console.log(UserModel.list());

    res.status(201).json({
      success: true,
      data: {
        user_id: user.id,
        api_key: plainApiKey,
        created_at: user.created_at,
      },
      message: 'API key created successfully. Store it securely - it will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify API key
 */
router.get('/verify', (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
    });
  }

  const user = UserModel.findByApiKey(apiKey);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
  }

  res.json({
    success: true,
    data: {
      user_id: user.id,
      created_at: user.created_at,
      last_active: user.last_active,
    },
  });
});

export default router;
