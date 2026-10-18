import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import {
  initialUsers,
  initialDepartments,
  initialDoctors,
  initialPatients,
  initialMedicines,
  initialRooms,
  initialAppointments,
  initialMedicalRecords,
  initialPrescriptions,
  initialBills,
} from './seedData.js';

// In-memory runtime state clone (used when Prisma connection to Supabase is not yet configured)
let memoryStore: {
  users: any[];
  departments: any[];
  doctors: any[];
  patients: any[];
  medicines: any[];
  rooms: any[];
  appointments: any[];
  medicalRecords: any[];
  prescriptions: any[];
  bills: any[];
  auditLogs: any[];
} = {
  users: [...initialUsers],
  departments: [...initialDepartments],
  doctors: [...initialDoctors],
  patients: [...initialPatients],
  medicines: [...initialMedicines],
  rooms: [...initialRooms],
  appointments: [...initialAppointments],
  medicalRecords: [...initialMedicalRecords],
  prescriptions: [...initialPrescriptions],
  bills: [...initialBills],
  auditLogs: [
    {
      id: 'log-1',
      userId: 'user-admin',
      action: 'SYSTEM_INITIALIZATION',
      resource: 'System',
      details: 'Demonstration hospital records initialized in memory.',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    },
  ],
};

let prismaAvailable = false;

// Check if Prisma is currently connected
export async function isPrismaConnected(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('[YOUR-PROJECT-REF]')) {
    prismaAvailable = false;
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    prismaAvailable = true;
    return true;
  } catch {
    prismaAvailable = false;
    return false;
  }
}

// --- Helpers ---

// Prisma throws P2025 when an update/delete target does not exist
function isRecordNotFound(err: any): boolean {
  return err?.code === 'P2025';
}

// Sequence helpers: generate the next human-readable number (MRN, APT, RX, INV...)
// from the highest existing value, so numbers never collide across sessions.
function parseSequence(value: string | null | undefined, prefix: string): number {
  if (!value || !value.startsWith(prefix)) return 0;
  const parsed = parseInt(value.slice(prefix.length), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function nextSequence(values: Array<string | null | undefined>, prefix: string, pad: number): string {
  let max = 0;
  for (const value of values) {
    const parsed = parseSequence(value, prefix);
    if (parsed > max) max = parsed;
  }
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

// Never expose password hashes to API consumers
function sanitizeUser<T>(user: T): T {
  if (!user) return user;
  const { passwordHash, ...safe } = user as any;
  return safe as T;
}

const publicUserSelect: Prisma.UserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  phoneNumber: true,
};

async function nextPatientMRN(): Promise<string> {
  const prefix = 'MRN-2026-';
  if (await isPrismaConnected()) {
    const rows = await prisma.patient.findMany({ select: { medicalRecordNumber: true } });
    return nextSequence(rows.map(r => r.medicalRecordNumber), prefix, 4);
  }
  return nextSequence(memoryStore.patients.map(p => p.medicalRecordNumber), prefix, 4);
}

async function nextAppointmentNo(): Promise<string> {
  const prefix = 'APT-2026-';
  if (await isPrismaConnected()) {
    const rows = await prisma.appointment.findMany({ select: { appointmentNo: true } });
    return nextSequence(rows.map(r => r.appointmentNo), prefix, 4);
  }
  return nextSequence(memoryStore.appointments.map(a => a.appointmentNo), prefix, 4);
}

async function nextMedicalRecordNo(): Promise<string> {
  const prefix = 'MR-2026-';
  if (await isPrismaConnected()) {
    const rows = await prisma.medicalRecord.findMany({ select: { recordNumber: true } });
    return nextSequence(rows.map(r => r.recordNumber), prefix, 3);
  }
  return nextSequence(memoryStore.medicalRecords.map(r => r.recordNumber), prefix, 3);
}

async function nextPrescriptionNo(): Promise<string> {
  const prefix = 'RX-2026-';
  if (await isPrismaConnected()) {
    const rows = await prisma.prescription.findMany({ select: { prescriptionNo: true } });
    return nextSequence(rows.map(r => r.prescriptionNo), prefix, 3);
  }
  return nextSequence(memoryStore.prescriptions.map(r => r.prescriptionNo), prefix, 3);
}

async function nextBillNumber(): Promise<string> {
  const prefix = 'INV-2026-';
  if (await isPrismaConnected()) {
    const rows = await prisma.bill.findMany({ select: { billNumber: true } });
    return nextSequence(rows.map(r => r.billNumber), prefix, 3);
  }
  return nextSequence(memoryStore.bills.map(b => b.billNumber), prefix, 3);
}

export const dataService = {
  // --- USERS & AUTH ---
  async findUserByEmail(email: string) {
    if (await isPrismaConnected()) {
      return prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { doctor: true, patient: true },
      });
    }
    const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const doctor = memoryStore.doctors.find(d => d.userId === user.id);
    const patient = memoryStore.patients.find(p => p.userId === user.id);
    return { ...user, doctor, patient };
  },

  async findUserById(id: string) {
    if (await isPrismaConnected()) {
      return prisma.user.findUnique({
        where: { id },
        include: { doctor: true, patient: true },
      });
    }
    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return null;
    const doctor = memoryStore.doctors.find(d => d.userId === user.id);
    const patient = memoryStore.patients.find(p => p.userId === user.id);
    return { ...user, doctor, patient };
  },

  // --- PATIENTS ---
  async getPatients(search?: string, gender?: string, bloodGroup?: string) {
    if (await isPrismaConnected()) {
      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { medicalRecordNumber: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (gender) where.gender = gender;
      if (bloodGroup) where.bloodGroup = bloodGroup;
      return prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      });
    }

    let result = [...memoryStore.patients];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.medicalRecordNumber.toLowerCase().includes(q) ||
          p.contactNumber.includes(q)
      );
    }
    if (gender) result = result.filter(p => p.gender === gender);
    if (bloodGroup) result = result.filter(p => p.bloodGroup === bloodGroup);
    return result;
  },

  async getPatientById(id: string) {
    if (await isPrismaConnected()) {
      return prisma.patient.findUnique({
        where: { id },
        include: {
          user: { select: publicUserSelect },
          appointments: { include: { doctor: { include: { user: { select: publicUserSelect }, department: true } } } },
          medicalRecords: { include: { doctor: { include: { user: { select: publicUserSelect } } } } },
          prescriptions: { include: { doctor: { include: { user: { select: publicUserSelect } } }, items: { include: { medicine: true } } } },
          bills: { include: { items: true } },
        },
      });
    }
    const patient = memoryStore.patients.find(p => p.id === id);
    if (!patient) return null;
    const apts = memoryStore.appointments
      .filter(a => a.patientId === id)
      .map(a => {
        const doc = memoryStore.doctors.find(d => d.id === a.doctorId);
        const docUser = doc ? sanitizeUser(memoryStore.users.find(u => u.id === doc.userId)) : null;
        const dept = doc ? memoryStore.departments.find(dp => dp.id === doc.departmentId) : null;
        return { ...a, doctor: { ...doc, user: docUser, department: dept } };
      });
    const records = memoryStore.medicalRecords
      .filter(r => r.patientId === id)
      .map(r => {
        const doc = memoryStore.doctors.find(d => d.id === r.doctorId);
        const docUser = doc ? sanitizeUser(memoryStore.users.find(u => u.id === doc.userId)) : null;
        return { ...r, doctor: { ...doc, user: docUser } };
      });
    const prescriptions = memoryStore.prescriptions
      .filter(px => px.patientId === id)
      .map(px => {
        const doc = memoryStore.doctors.find(d => d.id === px.doctorId);
        const docUser = doc ? sanitizeUser(memoryStore.users.find(u => u.id === doc.userId)) : null;
        const items = px.items.map((item: any) => ({
          ...item,
          medicine: memoryStore.medicines.find(m => m.id === item.medicineId),
        }));
        return { ...px, doctor: { ...doc, user: docUser }, items };
      });
    const bills = memoryStore.bills.filter(b => b.patientId === id);
    return { ...patient, appointments: apts, medicalRecords: records, prescriptions, bills };
  },

  async countPatients(): Promise<number> {
    if (await isPrismaConnected()) {
      return prisma.patient.count();
    }
    return memoryStore.patients.length;
  },

  async generateNextMRN(): Promise<string> {
    return nextPatientMRN();
  },

  async createPatient(data: any) {
    const medicalRecordNumber = data.medicalRecordNumber || (await nextPatientMRN());

    if (await isPrismaConnected()) {
      return prisma.patient.create({
        data: {
          userId: data.userId || null,
          medicalRecordNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          bloodGroup: data.bloodGroup || null,
          contactNumber: data.contactNumber,
          emergencyContact: data.emergencyContact || null,
          address: data.address || null,
          pincode: data.pincode || null,
          allergies: data.allergies || null,
          chronicConditions: data.chronicConditions || null,
        },
      });
    }

    const newPatient = {
      id: `pat-${Date.now()}`,
      userId: data.userId || null,
      medicalRecordNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup || null,
      contactNumber: data.contactNumber,
      emergencyContact: data.emergencyContact || null,
      address: data.address || null,
      pincode: data.pincode || null,
      allergies: data.allergies || null,
      chronicConditions: data.chronicConditions || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.patients.unshift(newPatient);
    return newPatient;
  },

  async updatePatient(id: string, data: any) {
    if (await isPrismaConnected()) {
      const payload: any = { ...data };
      if (payload.dateOfBirth) payload.dateOfBirth = new Date(payload.dateOfBirth);
      try {
        return await prisma.patient.update({ where: { id }, data: payload });
      } catch (err) {
        if (isRecordNotFound(err)) return null;
        throw err;
      }
    }
    const idx = memoryStore.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    memoryStore.patients[idx] = { ...memoryStore.patients[idx], ...data, updatedAt: new Date().toISOString() };
    return memoryStore.patients[idx];
  },

  // --- DOCTORS & DEPARTMENTS ---
  async getDoctors(departmentId?: string) {
    if (await isPrismaConnected()) {
      const where = departmentId ? { departmentId } : {};
      return prisma.doctor.findMany({
        where,
        include: { user: { select: publicUserSelect }, department: true },
      });
    }
    let docs = [...memoryStore.doctors];
    if (departmentId) docs = docs.filter(d => d.departmentId === departmentId);
    return docs.map(d => ({
      ...d,
      user: sanitizeUser(memoryStore.users.find(u => u.id === d.userId)),
      department: memoryStore.departments.find(dep => dep.id === d.departmentId),
    }));
  },

  async getDepartments() {
    if (await isPrismaConnected()) {
      return prisma.department.findMany({
        include: { _count: { select: { doctors: true, rooms: true } } },
      });
    }
    return memoryStore.departments.map(d => ({
      ...d,
      _count: {
        doctors: memoryStore.doctors.filter(doc => doc.departmentId === d.id).length,
        rooms: memoryStore.rooms.filter(rm => rm.departmentId === d.id).length,
      },
    }));
  },

  // --- APPOINTMENTS ---
  async getAppointments(filters: { doctorId?: string; patientId?: string; status?: string; date?: string }) {
    if (await isPrismaConnected()) {
      const where: any = {};
      if (filters.doctorId) where.doctorId = filters.doctorId;
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.status) where.status = filters.status;
      if (filters.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        where.scheduledAt = { gte: start, lte: end };
      }
      return prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: { select: publicUserSelect }, department: true } },
          medicalRecord: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    let apts = [...memoryStore.appointments];
    if (filters.doctorId) apts = apts.filter(a => a.doctorId === filters.doctorId);
    if (filters.patientId) apts = apts.filter(a => a.patientId === filters.patientId);
    if (filters.status) apts = apts.filter(a => a.status === filters.status);
    if (filters.date) {
      const targetDateStr = filters.date.slice(0, 10);
      apts = apts.filter(a => a.scheduledAt.slice(0, 10) === targetDateStr);
    }
    return apts.map(a => {
      const patient = memoryStore.patients.find(p => p.id === a.patientId);
      const doctor = memoryStore.doctors.find(d => d.id === a.doctorId);
      const docUser = doctor ? sanitizeUser(memoryStore.users.find(u => u.id === doctor.userId)) : null;
      const dept = doctor ? memoryStore.departments.find(dep => dep.id === doctor.departmentId) : null;
      const medicalRecord = memoryStore.medicalRecords.find(r => r.appointmentId === a.id);
      return {
        ...a,
        patient,
        doctor: { ...doctor, user: docUser, department: dept },
        medicalRecord,
      };
    });
  },

  async createAppointment(data: any) {
    const appointmentNo = data.appointmentNo || (await nextAppointmentNo());
    const status = data.status || 'SCHEDULED';

    if (await isPrismaConnected()) {
      return prisma.appointment.create({
        data: {
          appointmentNo,
          patientId: data.patientId,
          doctorId: data.doctorId,
          scheduledAt: new Date(data.scheduledAt),
          timeSlot: data.timeSlot,
          reasonForVisit: data.reasonForVisit,
          status,
          vitalsNotes: data.vitalsNotes || null,
        },
        include: { patient: true, doctor: { include: { user: { select: publicUserSelect }, department: true } } },
      });
    }

    const newApt = {
      id: `apt-${Date.now()}`,
      appointmentNo,
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
      timeSlot: data.timeSlot,
      reasonForVisit: data.reasonForVisit,
      status,
      vitalsNotes: data.vitalsNotes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.appointments.push(newApt);
    const patient = memoryStore.patients.find(p => p.id === newApt.patientId);
    const doctor = memoryStore.doctors.find(d => d.id === newApt.doctorId);
    const docUser = doctor ? memoryStore.users.find(u => u.id === doctor.userId) : null;
    const dept = doctor ? memoryStore.departments.find(dp => dp.id === doctor.departmentId) : null;
    return { ...newApt, patient, doctor: { ...doctor, user: docUser, department: dept } };
  },

  async getAppointmentById(id: string) {
    if (await isPrismaConnected()) {
      return prisma.appointment.findUnique({ where: { id } });
    }
    return memoryStore.appointments.find(a => a.id === id) || null;
  },

  async updateAppointmentStatus(id: string, status: string) {
    if (await isPrismaConnected()) {
      try {
        return await prisma.appointment.update({
          where: { id },
          data: { status: status as any },
        });
      } catch (err) {
        if (isRecordNotFound(err)) return null;
        throw err;
      }
    }
    const idx = memoryStore.appointments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    memoryStore.appointments[idx] = {
      ...memoryStore.appointments[idx],
      status: status as any,
      updatedAt: new Date().toISOString(),
    };
    return memoryStore.appointments[idx];
  },

  // --- MEDICAL RECORDS ---
  async getMedicalRecords(patientId?: string, doctorId?: string) {
    if (await isPrismaConnected()) {
      const where: any = {};
      if (patientId) where.patientId = patientId;
      if (doctorId) where.doctorId = doctorId;
      return prisma.medicalRecord.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: { select: publicUserSelect }, department: true } },
          prescription: { include: { items: { include: { medicine: true } } } },
        },
        orderBy: { recordedAt: 'desc' },
      });
    }

    let records = [...memoryStore.medicalRecords];
    if (patientId) records = records.filter(r => r.patientId === patientId);
    if (doctorId) records = records.filter(r => r.doctorId === doctorId);
    return records.map(r => {
      const patient = memoryStore.patients.find(p => p.id === r.patientId);
      const doctor = memoryStore.doctors.find(d => d.id === r.doctorId);
      const docUser = doctor ? sanitizeUser(memoryStore.users.find(u => u.id === doctor.userId)) : null;
      const dept = doctor ? memoryStore.departments.find(dp => dp.id === doctor.departmentId) : null;
      const rx = memoryStore.prescriptions.find(p => p.medicalRecordId === r.id);
      let prescription = null;
      if (rx) {
        prescription = {
          ...rx,
          items: rx.items.map((item: any) => ({
            ...item,
            medicine: memoryStore.medicines.find(m => m.id === item.medicineId),
          })),
        };
      }
      return {
        ...r,
        patient,
        doctor: { ...doctor, user: docUser, department: dept },
        prescription,
      };
    });
  },

  async createMedicalRecord(data: any) {
    const recordNumber = data.recordNumber || (await nextMedicalRecordNo());

    if (await isPrismaConnected()) {
      return prisma.medicalRecord.create({
        data: {
          recordNumber,
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentId: data.appointmentId || null,
          chiefComplaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatmentPlan: data.treatmentPlan,
          clinicalNotes: data.clinicalNotes || null,
          labResults: data.labResults || null,
        },
        include: { patient: true, doctor: { include: { user: { select: publicUserSelect } } } },
      });
    }

    const newRecord = {
      id: `rec-${Date.now()}`,
      recordNumber,
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId || null,
      chiefComplaint: data.chiefComplaint,
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
      clinicalNotes: data.clinicalNotes || null,
      labResults: data.labResults || null,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.medicalRecords.unshift(newRecord);
    return newRecord;
  },

  // --- PRESCRIPTIONS & MEDICINES ---
  async getMedicines() {
    if (await isPrismaConnected()) {
      return prisma.medicine.findMany({ orderBy: { name: 'asc' } });
    }
    return [...memoryStore.medicines].sort((a, b) => a.name.localeCompare(b.name));
  },

  async createMedicine(data: any) {
    if (await isPrismaConnected()) {
      return prisma.medicine.create({ data });
    }
    const newMed = {
      id: `med-${Date.now()}`,
      code: data.code,
      name: data.name,
      genericName: data.genericName || null,
      category: data.category,
      dosageForm: data.dosageForm,
      strength: data.strength,
      unitPrice: Number(data.unitPrice),
      stockQuantity: Number(data.stockQuantity || 0),
      reorderLevel: Number(data.reorderLevel || 20),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.medicines.push(newMed);
    return newMed;
  },

  async updateMedicineStock(id: string, delta: number) {
    if (await isPrismaConnected()) {
      const med = await prisma.medicine.findUnique({ where: { id } });
      if (!med) return null;
      return prisma.medicine.update({
        where: { id },
        data: { stockQuantity: Math.max(0, med.stockQuantity + delta) },
      });
    }
    const med = memoryStore.medicines.find(m => m.id === id);
    if (!med) return null;
    med.stockQuantity = Math.max(0, med.stockQuantity + delta);
    return med;
  },

  async getPrescriptions(patientId?: string, doctorId?: string) {
    if (await isPrismaConnected()) {
      const where: any = {};
      if (patientId) where.patientId = patientId;
      if (doctorId) where.doctorId = doctorId;
      return prisma.prescription.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: { select: publicUserSelect } } },
          items: { include: { medicine: true } },
        },
        orderBy: { issuedAt: 'desc' },
      });
    }

    let rxs = [...memoryStore.prescriptions];
    if (patientId) rxs = rxs.filter(p => p.patientId === patientId);
    if (doctorId) rxs = rxs.filter(p => p.doctorId === doctorId);
    return rxs.map(rx => {
      const patient = memoryStore.patients.find(p => p.id === rx.patientId);
      const doctor = memoryStore.doctors.find(d => d.id === rx.doctorId);
      const docUser = doctor ? sanitizeUser(memoryStore.users.find(u => u.id === doctor.userId)) : null;
      const items = rx.items.map((item: any) => ({
        ...item,
        medicine: memoryStore.medicines.find(m => m.id === item.medicineId),
      }));
      return { ...rx, patient, doctor: { ...doctor, user: docUser }, items };
    });
  },

  async createPrescription(data: {
    patientId: string;
    doctorId: string;
    medicalRecordId?: string;
    generalAdvice?: string;
    items: Array<{ medicineId: string; dosage: string; frequency: string; duration: string; instructions?: string; quantity: number }>;
  }) {
    const prescriptionNo = await nextPrescriptionNo();
    const rxId = `rx-${Date.now()}`;

    if (await isPrismaConnected()) {
      return prisma.$transaction(async tx => {
        const prescription = await tx.prescription.create({
          data: {
            prescriptionNo,
            patientId: data.patientId,
            doctorId: data.doctorId,
            medicalRecordId: data.medicalRecordId || null,
            generalAdvice: data.generalAdvice || null,
            items: {
              create: data.items.map(item => ({
                medicineId: item.medicineId,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions || null,
                quantity: item.quantity,
              })),
            },
          },
          include: { items: { include: { medicine: true } } },
        });

        // Automatically deduct pharmacy inventory for each prescribed item
        for (const item of data.items) {
          const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
          if (med) {
            await tx.medicine.update({
              where: { id: med.id },
              data: { stockQuantity: Math.max(0, med.stockQuantity - item.quantity) },
            });
          }
        }

        return prescription;
      });
    }

    const itemsWithIds = data.items.map((item, idx) => ({
      id: `rxi-${Date.now()}-${idx}`,
      medicineId: item.medicineId,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions || null,
      quantity: item.quantity,
      createdAt: new Date().toISOString(),
    }));

    const newPrescription = {
      id: rxId,
      prescriptionNo,
      patientId: data.patientId,
      doctorId: data.doctorId,
      medicalRecordId: data.medicalRecordId || null,
      generalAdvice: data.generalAdvice || null,
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: itemsWithIds,
    };

    memoryStore.prescriptions.unshift(newPrescription);

    // Deduct stock in memory
    for (const item of data.items) {
      const med = memoryStore.medicines.find(m => m.id === item.medicineId);
      if (med) med.stockQuantity = Math.max(0, med.stockQuantity - item.quantity);
    }

    return newPrescription;
  },

  // --- ROOMS ---
  async getRooms() {
    if (await isPrismaConnected()) {
      return prisma.room.findMany({
        include: { department: true },
        orderBy: { roomNumber: 'asc' },
      });
    }
    return memoryStore.rooms.map(r => ({
      ...r,
      department: memoryStore.departments.find(d => d.id === r.departmentId),
    }));
  },

  async updateRoomStatus(id: string, status: string) {
    if (await isPrismaConnected()) {
      try {
        return await prisma.room.update({
          where: { id },
          data: { status: status as any },
        });
      } catch (err) {
        if (isRecordNotFound(err)) return null;
        throw err;
      }
    }
    const rm = memoryStore.rooms.find(r => r.id === id);
    if (!rm) return null;
    rm.status = status as any;
    return rm;
  },

  // --- BILLS ---
  async getBills(patientId?: string, status?: string) {
    if (await isPrismaConnected()) {
      const where: any = {};
      if (patientId) where.patientId = patientId;
      if (status) where.status = status;
      return prisma.bill.findMany({
        where,
        include: { patient: true, items: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    let bills = [...memoryStore.bills];
    if (patientId) bills = bills.filter(b => b.patientId === patientId);
    if (status) bills = bills.filter(b => b.status === status);
    return bills.map(b => ({
      ...b,
      patient: memoryStore.patients.find(p => p.id === b.patientId),
    }));
  },

  async createBill(data: {
    patientId: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
    discount?: number;
    notes?: string;
  }) {
    const billNumber = await nextBillNumber();
    const subTotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Number((subTotal * (data.taxRate ?? 0.05)).toFixed(2));
    const discount = data.discount || 0;
    const totalAmount = Number((subTotal + taxAmount - discount).toFixed(2));

    if (await isPrismaConnected()) {
      return prisma.bill.create({
        data: {
          billNumber,
          patientId: data.patientId,
          subTotal,
          taxAmount,
          discount,
          totalAmount,
          status: 'PENDING',
          notes: data.notes,
          items: {
            create: data.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: { items: true, patient: true },
      });
    }

    const newBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      patientId: data.patientId,
      subTotal,
      taxAmount,
      discount,
      totalAmount,
      status: 'PENDING' as const,
      notes: data.notes || null,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: data.items.map((item, idx) => ({
        id: `bi-${Date.now()}-${idx}`,
        billId: `bill-${Date.now()}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        createdAt: new Date().toISOString(),
      })),
    };
    memoryStore.bills.unshift(newBill);
    return { ...newBill, patient: memoryStore.patients.find(p => p.id === data.patientId) };
  },

  async getBillById(id: string) {
    if (await isPrismaConnected()) {
      return prisma.bill.findUnique({ where: { id }, include: { items: true, patient: true } });
    }
    return memoryStore.bills.find(b => b.id === id) || null;
  },

  async markBillAsPaid(id: string) {
    if (await isPrismaConnected()) {
      try {
        return await prisma.bill.update({
          where: { id },
          data: { status: 'PAID', paidAt: new Date() },
        });
      } catch (err) {
        if (isRecordNotFound(err)) return null;
        throw err;
      }
    }
    const bill = memoryStore.bills.find(b => b.id === id);
    if (!bill) return null;
    bill.status = 'PAID';
    bill.paidAt = new Date().toISOString();
    return bill;
  },

  // --- REPORTS & AUDIT LOGS ---
  async getDashboardStatistics() {
    if (await isPrismaConnected()) {
      const [
        totalPatients,
        totalDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        totalRooms,
        occupiedRooms,
        paidRevenue,
        pendingRevenue,
        departments,
        allDoctors,
        allAppointments,
      ] = await Promise.all([
        prisma.patient.count(),
        prisma.doctor.count(),
        prisma.appointment.count(),
        prisma.appointment.count({ where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } } }),
        prisma.appointment.count({ where: { status: 'COMPLETED' } }),
        prisma.room.count(),
        prisma.room.count({ where: { status: 'OCCUPIED' } }),
        prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { status: 'PAID' } }),
        prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { status: 'PENDING' } }),
        prisma.department.findMany({ orderBy: { name: 'asc' } }),
        prisma.doctor.findMany({ select: { id: true, departmentId: true } }),
        prisma.appointment.findMany({ select: { doctorId: true } }),
      ]);

      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      const totalRevenue = paidRevenue._sum.totalAmount || 0;
      const pendingRevenueTotal = pendingRevenue._sum.totalAmount || 0;

      // Appointments per department (via their doctors)
      const departmentDistribution = departments.map(dept => {
        const docIds = allDoctors.filter(d => d.departmentId === dept.id).map(d => d.id);
        return {
          name: dept.name,
          code: dept.code,
          appointments: allAppointments.filter(a => docIds.includes(a.doctorId)).length,
          doctors: docIds.length,
        };
      });

      // 7-day appointment activity trend (real data)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activityTrend: Array<{ day: string; scheduled: number; completed: number }> = [];
      for (let offset = 6; offset >= 0; offset--) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - offset);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const [scheduled, completed] = await Promise.all([
          prisma.appointment.count({
            where: { scheduledAt: { gte: dayStart, lt: dayEnd }, status: { not: 'CANCELLED' } },
          }),
          prisma.appointment.count({
            where: { scheduledAt: { gte: dayStart, lt: dayEnd }, status: 'COMPLETED' },
          }),
        ]);

        activityTrend.push({ day: dayNames[dayStart.getDay()], scheduled, completed });
      }

      return {
        totalPatients,
        totalDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        pendingRevenue: Number(pendingRevenueTotal.toFixed(2)),
        departmentDistribution,
        activityTrend,
      };
    }

    // In-memory demonstration mode
    const totalPatients = memoryStore.patients.length;
    const totalDoctors = memoryStore.doctors.length;
    const totalAppointments = memoryStore.appointments.length;
    const pendingAppointments = memoryStore.appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
    const completedAppointments = memoryStore.appointments.filter(a => a.status === 'COMPLETED').length;
    const totalRooms = memoryStore.rooms.length;
    const occupiedRooms = memoryStore.rooms.filter(r => r.status === 'OCCUPIED').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
    const totalRevenue = memoryStore.bills
      .filter(b => b.status === 'PAID')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingRevenue = memoryStore.bills
      .filter(b => b.status === 'PENDING')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // Department patient breakdown
    const departmentDistribution = memoryStore.departments.map(dept => {
      const docIds = memoryStore.doctors.filter(d => d.departmentId === dept.id).map(d => d.id);
      const appointmentCount = memoryStore.appointments.filter(a => docIds.includes(a.doctorId)).length;
      return {
        name: dept.name,
        code: dept.code,
        appointments: appointmentCount,
        doctors: docIds.length,
      };
    });

    // 7-day appointment activity trend (demonstration data)
    const activityTrend = [
      { day: 'Mon', scheduled: 4, completed: 3 },
      { day: 'Tue', scheduled: 6, completed: 5 },
      { day: 'Wed', scheduled: 8, completed: 7 },
      { day: 'Thu', scheduled: 5, completed: 4 },
      { day: 'Fri', scheduled: 9, completed: 8 },
      { day: 'Sat', scheduled: 3, completed: 3 },
      { day: 'Sun', scheduled: 2, completed: 2 },
    ];

    return {
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingRevenue: Number(pendingRevenue.toFixed(2)),
      departmentDistribution,
      activityTrend,
    };
  },

  async logAudit(userId: string | null, action: string, resource: string, details?: string, ipAddress?: string) {
    const ip = ipAddress || '127.0.0.1';

    if (await isPrismaConnected()) {
      try {
        return await prisma.auditLog.create({
          data: {
            userId: userId || null,
            action,
            resource,
            details: details || null,
            ipAddress: ip,
          },
        });
      } catch (err) {
        // Audit logging must never break the actual operation
        console.warn('[AuditLog] Failed to persist audit log to database:', err);
      }
    }

    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      action,
      resource,
      details: details || null,
      ipAddress: ip,
      createdAt: new Date().toISOString(),
    };
    memoryStore.auditLogs.unshift(entry);
    if (memoryStore.auditLogs.length > 100) memoryStore.auditLogs.pop();
    return entry;
  },

  async getAuditLogs(limit: number = 20) {
    if (await isPrismaConnected()) {
      return prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
    }
    return memoryStore.auditLogs.slice(0, limit);
  },
};
