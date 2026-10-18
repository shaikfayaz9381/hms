import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataService } from '../services/dataService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  doctorId: z.string().min(1, 'Doctor selection is required'),
  scheduledAt: z.string().min(1, 'Appointment date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  reasonForVisit: z.string().min(3, 'Reason for visit must be at least 3 characters'),
  vitalsNotes: z.string().optional(),
});

// GET /api/appointments
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, patientId, status, date } = req.query;
    const user = req.user!;

    const filters: any = {
      doctorId: doctorId as string,
      patientId: patientId as string,
      status: status as string,
      date: date as string,
    };

    // Patient can only view their own appointments
    if (user.role === 'PATIENT') {
      filters.patientId = user.patientId;
    } else if (user.role === 'DOCTOR' && !filters.doctorId) {
      filters.doctorId = user.doctorId;
    }

    const appointments = await dataService.getAppointments(filters);
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve appointments', details: err.message });
  }
});

// POST /api/appointments (Create with conflict detection)
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const parseResult = appointmentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid appointment input' });
    return;
  }

  const { patientId, doctorId, scheduledAt, timeSlot, reasonForVisit, vitalsNotes } = parseResult.data;

  // Patient booking restriction: patients can only book for themselves
  if (req.user?.role === 'PATIENT' && req.user.patientId !== patientId) {
    res.status(403).json({ error: 'Patients can only schedule appointments for themselves.' });
    return;
  }

  try {
    // Conflict detection: verify doctor is not already booked for this date and timeSlot
    const existing = await dataService.getAppointments({
      doctorId,
      date: scheduledAt,
    });

    const hasConflict = existing.some(
      a => a.timeSlot === timeSlot && a.status !== 'CANCELLED'
    );

    if (hasConflict) {
      res.status(409).json({
        error: `Doctor is already booked for ${timeSlot} on this date. Please select another slot.`,
      });
      return;
    }

    const appointment = await dataService.createAppointment({
      patientId,
      doctorId,
      scheduledAt,
      timeSlot,
      reasonForVisit,
      vitalsNotes,
      status: 'SCHEDULED',
    });

    await dataService.logAudit(
      req.user!.id,
      'SCHEDULE_APPOINTMENT',
      'Appointment',
      `Booked appointment ${appointment.appointmentNo} for patient ${patientId} with doctor ${doctorId}`,
      req.ip
    );

    res.status(201).json(appointment);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to schedule appointment', details: err.message });
  }
});

// PUT /api/appointments/:id/status
router.put('/:id/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    // Patients may only cancel their own appointments
    if (req.user?.role === 'PATIENT') {
      const target = await dataService.getAppointmentById(req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }
      if (target.patientId !== req.user.patientId) {
        res.status(403).json({ error: 'Access denied: You may only manage your own appointments.' });
        return;
      }
      if (status !== 'CANCELLED') {
        res.status(403).json({ error: 'Access denied: Patients may only cancel their own appointments.' });
        return;
      }
    }

    const updated = await dataService.updateAppointmentStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    await dataService.logAudit(
      req.user!.id,
      'UPDATE_APPOINTMENT_STATUS',
      'Appointment',
      `Updated appointment ${req.params.id} status to ${status}`,
      req.ip
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update appointment status', details: err.message });
  }
});

export default router;
