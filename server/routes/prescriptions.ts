import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataService } from '../services/dataService.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine selection is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., Twice daily)'),
  duration: z.string().min(1, 'Duration is required (e.g., 7 days)'),
  instructions: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  medicalRecordId: z.string().optional(),
  generalAdvice: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine item is required'),
});

const medicineSchema = z.object({
  code: z.string().min(2, 'Code is required'),
  name: z.string().min(2, 'Medicine name is required'),
  genericName: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  dosageForm: z.string().min(2, 'Dosage form is required'),
  strength: z.string().min(1, 'Strength is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  stockQuantity: z.number().int().nonnegative('Stock must be >= 0'),
  reorderLevel: z.number().int().nonnegative().optional(),
});

// GET /api/prescriptions
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let patientId = req.query.patientId as string | undefined;
    let doctorId = req.query.doctorId as string | undefined;

    if (user.role === 'PATIENT') {
      patientId = user.patientId;
    } else if (user.role === 'DOCTOR' && !doctorId && !patientId) {
      doctorId = user.doctorId;
    }

    const prescriptions = await dataService.getPrescriptions(patientId, doctorId);
    res.json(prescriptions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve prescriptions', details: err.message });
  }
});

// POST /api/prescriptions (Doctor, Admin)
router.post('/', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = prescriptionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid prescription' });
    return;
  }

  try {
    const prescription = await dataService.createPrescription(parseResult.data);
    await dataService.logAudit(
      req.user!.id,
      'CREATE_PRESCRIPTION',
      'Prescription',
      `Issued digital prescription ${prescription.prescriptionNo} with ${parseResult.data.items.length} items`,
      req.ip
    );
    res.status(201).json(prescription);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create prescription', details: err.message });
  }
});

// GET /api/prescriptions/medicines
router.get('/medicines', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const medicines = await dataService.getMedicines();
    res.json(medicines);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve medicines inventory', details: err.message });
  }
});

// POST /api/prescriptions/medicines (Admin only)
router.post('/medicines', authenticateToken, requireRoles('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = medicineSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid medicine data' });
    return;
  }

  try {
    const medicine = await dataService.createMedicine(parseResult.data);
    await dataService.logAudit(
      req.user!.id,
      'ADD_MEDICINE',
      'Medicine',
      `Added ${medicine.name} (${medicine.code}) to pharmacy inventory`,
      req.ip
    );
    res.status(201).json(medicine);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register medicine', details: err.message });
  }
});

// PUT /api/prescriptions/medicines/:id/stock (Admin, Doctor, Receptionist)
router.put('/medicines/:id/stock', authenticateToken, requireRoles('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response): Promise<void> => {
  const { delta } = req.body;
  if (typeof delta !== 'number') {
    res.status(400).json({ error: 'Field "delta" (number) is required' });
    return;
  }

  try {
    const updated = await dataService.updateMedicineStock(req.params.id, delta);
    if (!updated) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }

    await dataService.logAudit(
      req.user!.id,
      'UPDATE_MEDICINE_STOCK',
      'Medicine',
      `Adjusted stock for ${updated.name} by ${delta} units (New total: ${updated.stockQuantity})`,
      req.ip
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update stock', details: err.message });
  }
});

export default router;
