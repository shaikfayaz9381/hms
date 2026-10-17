import { Router, Request, Response } from 'express';
import { dataService } from '../services/dataService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/doctors
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.query;
    const doctors = await dataService.getDoctors(departmentId as string);
    res.json(doctors);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve doctors', details: err.message });
  }
});

// GET /api/departments
router.get('/departments', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await dataService.getDepartments();
    res.json(departments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve departments', details: err.message });
  }
});

export default router;
