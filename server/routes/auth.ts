import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { dataService } from '../services/dataService.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid input' });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const user = await dataService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials: No account found with that email address.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated. Please contact the hospital administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials: Incorrect password.' });
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      doctorId: (user as any).doctor?.id,
      patientId: (user as any).patient?.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    await dataService.logAudit(user.id, 'USER_LOGIN', 'Auth', `Successful login for ${user.email} (${user.role})`, req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        doctorId: (user as any).doctor?.id,
        patientId: (user as any).patient?.id,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal login error', details: err.message });
  }
});

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  contactNumber: z.string().min(5, 'Contact number is required'),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});

// POST /api/auth/register — Public patient self-registration
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid input' });
    return;
  }

  const { firstName, lastName, email, password, dateOfBirth, gender, bloodGroup, contactNumber, emergencyContact, address, pincode, allergies, chronicConditions } = parseResult.data;

  try {
    // Check if email already exists
    const existingUser = await dataService.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Generate the next unique Medical Record Number
    const nextMRN = await dataService.generateNextMRN();

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and patient in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: 'PATIENT',
          firstName,
          lastName,
          phoneNumber: contactNumber,
          isActive: true,
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          medicalRecordNumber: nextMRN,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender as any,
          bloodGroup: bloodGroup || null,
          contactNumber,
          emergencyContact: emergencyContact || null,
          address: address || null,
          pincode: pincode || null,
          allergies: allergies || null,
          chronicConditions: chronicConditions || null,
        },
      });

      return { user, patient };
    });

    await dataService.logAudit(result.user.id, 'PATIENT_SELF_REGISTER', 'Patient', `New patient self-registered: ${result.user.email} (${result.patient.medicalRecordNumber})`, req.ip);

    res.status(201).json({
      message: 'Registration successful. You can now sign in.',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      patient: {
        id: result.patient.id,
        medicalRecordNumber: result.patient.medicalRecordNumber,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await dataService.logAudit(req.user.id, 'USER_LOGOUT', 'Auth', `User ${req.user.email} signed out`, req.ip);
  }
  res.json({ message: 'Successfully signed out.' });
});

router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await dataService.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      doctorId: (user as any).doctor?.id,
      patientId: (user as any).patient?.id,
      doctor: (user as any).doctor,
      patient: (user as any).patient,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
  }
});

export default router;
