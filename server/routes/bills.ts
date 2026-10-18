import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataService } from '../services/dataService.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

const billItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

const billSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  items: z.array(billItemSchema).min(1, 'At least one bill item is required'),
  taxRate: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

// GET /api/bills
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;

    // Strict access control: Patient only sees their own bills
    if (user.role === 'PATIENT') {
      patientId = user.patientId;
    }

    const bills = await dataService.getBills(patientId, status);
    res.json(bills);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve bills', details: err.message });
  }
});

// POST /api/bills (Receptionist, Admin)
router.post('/', authenticateToken, requireRoles('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = billSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid bill data' });
    return;
  }

  try {
    const bill = await dataService.createBill(parseResult.data);
    await dataService.logAudit(
      req.user!.id,
      'CREATE_BILL',
      'Bill',
      `Generated invoice ${bill.billNumber} for total ₹${bill.totalAmount}`,
      req.ip
    );
    res.status(201).json(bill);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate bill', details: err.message });
  }
});

// PUT /api/bills/:id/pay (Simulated payment update)
router.put('/:id/pay', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await dataService.getBillById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Patients may only pay their own invoices
    if (req.user?.role === 'PATIENT' && existing.patientId !== req.user.patientId) {
      res.status(403).json({ error: 'Access denied: You may only manage your own invoices.' });
      return;
    }

    const updated = await dataService.markBillAsPaid(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    await dataService.logAudit(
      req.user!.id,
      'SIMULATED_BILL_PAYMENT',
      'Bill',
      `Invoice ${updated.billNumber} marked as PAID (Academic simulation only)`,
      req.ip
    );

    res.json({
      message: 'Simulated payment recorded successfully. Academic demonstration only.',
      bill: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record payment', details: err.message });
  }
});

export default router;
