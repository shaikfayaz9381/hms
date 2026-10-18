import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataService } from '../services/dataService.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  contactNumber: z.string().min(5, 'Contact number is required'),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});

const patientUpdateSchema = patientSchema.partial();

// GET /api/patients (Admin, Doctor, Receptionist)
router.get('/', authenticateToken, requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, gender, bloodGroup } = req.query;
    const patients = await dataService.getPatients(
      search as string,
      gender as string,
      bloodGroup as string
    );
    res.json(patients);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve patients list', details: err.message });
  }
});

// GET /api/patients/:id (Patient can only view own record; Staff can view any)
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Strict ownership validation for PATIENT role
    if (req.user?.role === 'PATIENT' && req.user.patientId !== id) {
      await dataService.logAudit(
        req.user.id,
        'PATIENT_ISOLATION_VIOLATION_BLOCKED',
        'Patient',
        `Patient attempted to view unpermitted patient ID ${id}`,
        req.ip
      );
      res.status(403).json({ error: 'Access denied: You may only access your own medical records.' });
      return;
    }

    const patient = await dataService.getPatientById(id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json(patient);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch patient chart', details: err.message });
  }
});

// POST /api/patients (Receptionist, Admin)
router.post('/', authenticateToken, requireRoles('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = patientSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid patient input' });
    return;
  }

  try {
    const newPatient = await dataService.createPatient(parseResult.data);
    await dataService.logAudit(
      req.user!.id,
      'REGISTER_PATIENT',
      'Patient',
      `Registered patient ${newPatient.firstName} ${newPatient.lastName} (${newPatient.medicalRecordNumber})`,
      req.ip
    );
    res.status(201).json(newPatient);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create patient', details: err.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', authenticateToken, requireRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = patientUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid patient update input' });
    return;
  }

  try {
    const { id } = req.params;
    const updated = await dataService.updatePatient(id, parseResult.data);
    if (!updated) {
      res.status(404).json({ error: 'Patient record not found' });
      return;
    }

    await dataService.logAudit(req.user!.id, 'UPDATE_PATIENT', 'Patient', `Updated details for patient ID ${id}`, req.ip);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update patient', details: err.message });
  }
});

export default router;
