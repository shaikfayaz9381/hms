import { PrismaClient } from '@prisma/client';
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
} from '../server/services/seedData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting safe, repeatable seed process for Supabase PostgreSQL...');

  // 1. Seed Departments
  console.log('-> Seeding Departments...');
  for (const dept of initialDepartments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description, location: dept.location },
      create: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        location: dept.location,
      },
    });
  }

  // 2. Seed Users
  console.log('-> Seeding Users & Demo Accounts...');
  for (const u of initialUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        phoneNumber: u.phoneNumber,
        role: u.role as any,
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as any,
        firstName: u.firstName,
        lastName: u.lastName,
        phoneNumber: u.phoneNumber,
        isActive: u.isActive,
      },
    });
  }

  // 3. Seed Doctors
  console.log('-> Seeding Doctors...');
  for (const doc of initialDoctors) {
    await prisma.doctor.upsert({
      where: { licenseNumber: doc.licenseNumber },
      update: {
        specialization: doc.specialization,
        consultationFee: doc.consultationFee,
        experienceYears: doc.experienceYears,
        bio: doc.bio,
      },
      create: {
        id: doc.id,
        userId: doc.userId,
        departmentId: doc.departmentId,
        specialization: doc.specialization,
        licenseNumber: doc.licenseNumber,
        consultationFee: doc.consultationFee,
        experienceYears: doc.experienceYears,
        bio: doc.bio,
      },
    });
  }

  // 4. Seed Patients
  console.log('-> Seeding Patients...');
  for (const pat of initialPatients) {
    await prisma.patient.upsert({
      where: { medicalRecordNumber: pat.medicalRecordNumber },
      update: {
        firstName: pat.firstName,
        lastName: pat.lastName,
        contactNumber: pat.contactNumber,
        emergencyContact: pat.emergencyContact,
        allergies: pat.allergies,
        chronicConditions: pat.chronicConditions,
      },
      create: {
        id: pat.id,
        userId: pat.userId,
        medicalRecordNumber: pat.medicalRecordNumber,
        firstName: pat.firstName,
        lastName: pat.lastName,
        dateOfBirth: new Date(pat.dateOfBirth),
        gender: pat.gender as any,
        bloodGroup: pat.bloodGroup,
        contactNumber: pat.contactNumber,
        emergencyContact: pat.emergencyContact,
        address: pat.address,
        allergies: pat.allergies,
        chronicConditions: pat.chronicConditions,
      },
    });
  }

  // 5. Seed Medicines
  console.log('-> Seeding Medicines...');
  for (const med of initialMedicines) {
    await prisma.medicine.upsert({
      where: { code: med.code },
      update: {
        stockQuantity: med.stockQuantity,
        unitPrice: med.unitPrice,
      },
      create: {
        id: med.id,
        code: med.code,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        dosageForm: med.dosageForm,
        strength: med.strength,
        unitPrice: med.unitPrice,
        stockQuantity: med.stockQuantity,
        reorderLevel: med.reorderLevel,
      },
    });
  }

  // 6. Seed Rooms
  console.log('-> Seeding Hospital Rooms...');
  for (const room of initialRooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {
        status: room.status as any,
        dailyRate: room.dailyRate,
      },
      create: {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        type: room.type as any,
        status: room.status as any,
        dailyRate: room.dailyRate,
        departmentId: room.departmentId,
      },
    });
  }

  // 7. Seed Appointments
  console.log('-> Seeding Appointments...');
  for (const apt of initialAppointments) {
    await prisma.appointment.upsert({
      where: { appointmentNo: apt.appointmentNo },
      update: {
        status: apt.status as any,
        vitalsNotes: apt.vitalsNotes,
      },
      create: {
        id: apt.id,
        appointmentNo: apt.appointmentNo,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        scheduledAt: new Date(apt.scheduledAt),
        timeSlot: apt.timeSlot,
        reasonForVisit: apt.reasonForVisit,
        status: apt.status as any,
        vitalsNotes: apt.vitalsNotes,
      },
    });
  }

  // 8. Seed Medical Records
  console.log('-> Seeding Medical Records...');
  for (const rec of initialMedicalRecords) {
    await prisma.medicalRecord.upsert({
      where: { recordNumber: rec.recordNumber },
      update: {
        chiefComplaint: rec.chiefComplaint,
        diagnosis: rec.diagnosis,
        treatmentPlan: rec.treatmentPlan,
      },
      create: {
        id: rec.id,
        recordNumber: rec.recordNumber,
        patientId: rec.patientId,
        doctorId: rec.doctorId,
        appointmentId: rec.appointmentId,
        chiefComplaint: rec.chiefComplaint,
        diagnosis: rec.diagnosis,
        treatmentPlan: rec.treatmentPlan,
        clinicalNotes: rec.clinicalNotes,
        labResults: rec.labResults,
        recordedAt: new Date(rec.recordedAt),
      },
    });
  }

  // 9. Seed Prescriptions
  console.log('-> Seeding Prescriptions...');
  for (const rx of initialPrescriptions) {
    const existing = await prisma.prescription.findUnique({
      where: { prescriptionNo: rx.prescriptionNo },
    });
    if (!existing) {
      await prisma.prescription.create({
        data: {
          id: rx.id,
          prescriptionNo: rx.prescriptionNo,
          patientId: rx.patientId,
          doctorId: rx.doctorId,
          medicalRecordId: rx.medicalRecordId,
          generalAdvice: rx.generalAdvice,
          issuedAt: new Date(rx.issuedAt),
          items: {
            create: rx.items.map(item => ({
              id: item.id,
              medicineId: item.medicineId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              quantity: item.quantity,
            })),
          },
        },
      });
    }
  }

  // 10. Seed Bills
  console.log('-> Seeding Invoices & Bills...');
  for (const bill of initialBills) {
    const existing = await prisma.bill.findUnique({
      where: { billNumber: bill.billNumber },
    });
    if (!existing) {
      await prisma.bill.create({
        data: {
          id: bill.id,
          billNumber: bill.billNumber,
          patientId: bill.patientId,
          subTotal: bill.subTotal,
          taxAmount: bill.taxAmount,
          discount: bill.discount,
          totalAmount: bill.totalAmount,
          status: bill.status as any,
          notes: bill.notes,
          paidAt: bill.paidAt ? new Date(bill.paidAt) : null,
          items: {
            create: bill.items.map(bi => ({
              id: bi.id,
              description: bi.description,
              quantity: bi.quantity,
              unitPrice: bi.unitPrice,
              totalPrice: bi.totalPrice,
            })),
          },
        },
      });
    }
  }

  console.log('✅ Demonstration seed data successfully populated in Supabase PostgreSQL!');
}

main()
  .catch(e => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
