import { Router, Request, Response } from 'express';
import { dataService } from '../services/dataService.js';
import { checkDatabaseConnection } from '../db.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/dashboard
router.get('/dashboard', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await dataService.getDashboardStatistics();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate dashboard statistics', details: err.message });
  }
});

// GET /api/reports/audit-logs (Admin only)
router.get('/audit-logs', authenticateToken, requireRoles('ADMIN'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await dataService.getAuditLogs(50);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: err.message });
  }
});

// GET /api/reports/database-status (Exposes connection status without secrets)
router.get('/database-status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await checkDatabaseConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      isConnected: false,
      isSupabase: false,
      host: 'Error',
      databaseName: 'None',
      message: 'Failed to check database connectivity',
      error: err.message,
    });
  }
});

export default router;
