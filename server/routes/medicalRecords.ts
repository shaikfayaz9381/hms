import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataService } from '../services/dataService.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

const medicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentId: z.string().optional(),
  chiefComplaint: z.string().min(3, 'Chief complaint is required'),
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  treatmentPlan: z.string().min(3, 'Treatment plan is required'),
  clinicalNotes: z.string().optional(),
  labResults: z.string().optional(),
});

// GET /api/medical-records
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let patientId = req.query.patientId as string | undefined;
    let doctorId = req.query.doctorId as string | undefined;

    // Strict security check: Patients can ONLY access their own records
    if (user.role === 'PATIENT') {
      patientId = user.patientId;
    } else if (user.role === 'DOCTOR' && !doctorId && !patientId) {
      doctorId = user.doctorId;
    }

    const records = await dataService.getMedicalRecords(patientId, doctorId);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve medical records', details: err.message });
  }
});

// POST /api/medical-records (Doctor, Admin)
router.post('/', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = medicalRecordSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid medical record input' });
    return;
  }

  try {
    const record = await dataService.createMedicalRecord(parseResult.data);
    await dataService.logAudit(
      req.user!.id,
      'CREATE_MEDICAL_RECORD',
      'MedicalRecord',
      `Created clinical diagnosis record ${record.recordNumber} for patient ${record.patientId}`,
      req.ip
    );
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create medical record', details: err.message });
  }
});

export default router;
