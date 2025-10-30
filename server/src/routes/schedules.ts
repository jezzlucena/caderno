import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { ScheduleModel, RecipientModel, ExecutionLogModel } from '../models/schedule.js';
import { scheduler } from '../services/scheduler.js';
import CryptoJS from 'crypto-js';
import { db } from '../config/database.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/schedules
 * Create a new schedule
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, cron_expression, entry_selection_type, entry_ids, date_range_start, date_range_end, recipients, entries_data, passphrase } = req.body;

    if (!name || !cron_expression) {
      return res.status(400).json({
        success: false,
        error: 'Name and cron expression are required',
      });
    }

    if (!passphrase) {
      return res.status(400).json({
        success: false,
        error: 'Passphrase is required',
      });
    }

    // Store encrypted entries if provided
    if (entries_data && passphrase && req.user) {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(entries_data), passphrase).toString();
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO encrypted_entries (id, user_id, encrypted_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        req.user.id,
        req.user.id,
        encrypted,
        Date.now(),
        Date.now()
      );
    }

    const schedule = ScheduleModel.create(req.user!.id, {
      name,
      cron_expression,
      entry_selection_type: entry_selection_type || 'all',
      entry_ids,
      date_range_start,
      date_range_end,
      passphrase,
    });

    // Add recipients
    if (recipients && Array.isArray(recipients)) {
      for (const recipient of recipients) {
        if (recipient.type && recipient.value) {
          RecipientModel.create(schedule.id, recipient.type, recipient.value);
        }
      }
    }

    // Add to scheduler
    scheduler.addSchedule(schedule.id);

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
    });
  }
});

/**
 * GET /api/schedules
 * Get all schedules for the authenticated user
 */
router.get('/', (req: AuthRequest, res) => {
  try {
    const schedules = ScheduleModel.findByUserId(req.user!.id);
    
    // Attach recipients to each schedule
    const schedulesWithRecipients = schedules.map(schedule => ({
      ...schedule,
      recipients: RecipientModel.findByScheduleId(schedule.id),
    }));

    res.json({
      success: true,
      data: schedulesWithRecipients,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules',
    });
  }
});

/**
 * GET /api/schedules/:id
 * Get a specific schedule
 */
router.get('/:id', (req: AuthRequest, res) => {
  try {
    const schedule = ScheduleModel.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    if (schedule.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const recipients = RecipientModel.findByScheduleId(schedule.id);
    const logs = ExecutionLogModel.findByScheduleId(schedule.id, 10);

    res.json({
      success: true,
      data: {
        ...schedule,
        recipients,
        logs,
      },
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule',
    });
  }
});

/**
 * PUT /api/schedules/:id
 * Update a schedule
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const schedule = ScheduleModel.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    if (schedule.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { name, cron_expression, enabled, entry_selection_type, entry_ids, date_range_start, date_range_end, recipients } = req.body;

    const updated = ScheduleModel.update(req.params.id, {
      name,
      cron_expression,
      enabled,
      entry_selection_type,
      entry_ids,
      date_range_start,
      date_range_end,
    });

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update schedule',
      });
    }

    // Update recipients if provided
    if (recipients && Array.isArray(recipients)) {
      // Remove existing recipients
      RecipientModel.deleteByScheduleId(req.params.id);

      // Add new recipients
      for (const recipient of recipients) {
        if (recipient.type && recipient.value) {
          RecipientModel.create(req.params.id, recipient.type, recipient.value);
        }
      }
    }

    // Update scheduler
    if (enabled === false) {
      scheduler.removeSchedule(req.params.id);
    } else {
      scheduler.addSchedule(req.params.id);
    }

    const updatedSchedule = ScheduleModel.findById(req.params.id);

    res.json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
    });
  }
});

/**
 * DELETE /api/schedules/:id
 * Delete a schedule
 */
router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const schedule = ScheduleModel.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    if (schedule.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Remove from scheduler
    scheduler.removeSchedule(req.params.id);

    // Delete schedule (recipients and logs will be cascade deleted)
    const deleted = ScheduleModel.delete(req.params.id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete schedule',
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule',
    });
  }
});

/**
 * POST /api/schedules/:id/execute
 * Manually trigger a schedule execution
 */
router.post('/:id/execute', async (req: AuthRequest, res) => {
  try {
    const schedule = ScheduleModel.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    if (schedule.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Execute schedule asynchronously
    scheduler.triggerScheduleExecution(req.params.id).catch(error => {
      console.error('Manual execution failed:', error);
    });

    res.json({
      success: true,
      message: 'Schedule execution started',
    });
  } catch (error) {
    console.error('Error executing schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute schedule',
    });
  }
});

export default router;
