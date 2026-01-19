import { Router } from 'express';
import { entriesController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateEntrySchema, UpdateEntrySchema } from '@caderno/shared';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', entriesController.list);
router.get('/tags', entriesController.tags);
router.get('/:id', entriesController.getById);

router.post(
  '/',
  validate(CreateEntrySchema),
  entriesController.create
);

router.put(
  '/:id',
  validate(UpdateEntrySchema),
  entriesController.update
);

router.delete('/:id', entriesController.remove);

export default router;
