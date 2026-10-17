import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
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
