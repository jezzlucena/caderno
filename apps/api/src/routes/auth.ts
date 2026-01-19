import { Router } from 'express';
import { authController, passkeyController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { RegisterUserSchema, LoginUserSchema, MagicLinkRequestSchema, MagicLinkVerifySchema } from '@caderno/shared';

const router = Router();

// Password authentication
router.post(
  '/register',
  authRateLimiter,
  validate(RegisterUserSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate(LoginUserSchema),
  authController.login
);

router.post('/logout', authController.logoutHandler);

router.post('/refresh', authController.refresh);

router.get('/methods', authController.getAuthMethodsHandler);

// Magic link
router.post(
  '/magic-link/request',
  authRateLimiter,
  validate(MagicLinkRequestSchema),
  authController.requestMagicLink
);

router.post(
  '/magic-link/verify',
  authRateLimiter,
  validate(MagicLinkVerifySchema),
  authController.verifyMagicLinkHandler
);

// Passkey registration (requires auth)
router.post(
  '/passkey/register/options',
  authenticate,
  passkeyController.getRegistrationOptions
);

router.post(
  '/passkey/register/verify',
  authenticate,
  passkeyController.verifyRegistration
);

// Passkey authentication (public)
router.get(
  '/passkey/login/options',
  authRateLimiter,
  passkeyController.getLoginOptions
);

router.post(
  '/passkey/login/verify',
  authRateLimiter,
  passkeyController.verifyLogin
);

// Passkey management (requires auth)
router.get('/passkeys', authenticate, passkeyController.listPasskeys);
router.delete('/passkeys/:id', authenticate, passkeyController.removePasskey);

export default router;
