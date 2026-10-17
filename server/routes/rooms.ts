import { Router, Request, Response } from 'express';
import { dataService } from '../services/dataService.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

// GET /api/rooms
router.get('/', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await dataService.getRooms();
    res.json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve rooms', details: err.message });
  }
});

// PUT /api/rooms/:id/status
router.put('/:id/status', authenticateToken, requireRoles('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const updated = await dataService.updateRoomStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    await dataService.logAudit(
      req.user!.id,
      'UPDATE_ROOM_STATUS',
      'Room',
      `Room ${updated.roomNumber} status set to ${status}`,
      req.ip
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update room status', details: err.message });
  }
});

export default router;
