import { Router, Request, Response } from 'express';
import { dataService } from '../services/dataService.js';

const router = Router();

// GET /api/public/overview — public hospital website content (no authentication, no sensitive data)
router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [departments, doctors, rooms, medicines] = await Promise.all([
      dataService.getDepartments(),
      dataService.getDoctors(),
      dataService.getRooms(),
      dataService.getMedicines(),
    ]);

    res.json({
      hospital: {
        name: 'MedPulse Hospital',
        tagline: 'Compassionate care, advanced medicine.',
        phone: '+91-98765-43000',
        emergencyPhone: '+91-98765-43911',
        email: 'contact@medpulse.in',
        address: 'MedPulse Hospital, 42 Ring Road, Lajpat Nagar, New Delhi 110024',
        hours: 'OPD: Mon–Sat, 9:00 AM – 6:00 PM · Emergency: 24/7',
      },
      stats: {
        doctors: doctors.length,
        departments: departments.length,
        rooms: rooms.length,
        availableRooms: rooms.filter((r: any) => r.status === 'AVAILABLE').length,
        medicines: medicines.length,
      },
      departments: departments.map((d: any) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        location: d.location,
        doctorCount: d._count?.doctors ?? doctors.filter((doc: any) => doc.departmentId === d.id).length,
      })),
      doctors: doctors.map((doc: any) => ({
        id: doc.id,
        name: `Dr. ${doc.user?.firstName || ''} ${doc.user?.lastName || ''}`.trim(),
        specialization: doc.specialization,
        department: doc.department?.name,
        experienceYears: doc.experienceYears,
        consultationFee: doc.consultationFee,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load hospital overview', details: err.message });
  }
});

export default router;
