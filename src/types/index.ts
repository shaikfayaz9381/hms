export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  doctorId?: string;
  patientId?: string;
  doctor?: Doctor;
  patient?: Patient;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  _count?: {
    doctors: number;
    rooms: number;
  };
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: number;
  experienceYears: number;
  bio?: string;
  user?: User;
  department?: Department;
}

export interface Patient {
  id: string;
  userId?: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  contactNumber: string;
  emergencyContact?: string;
  address?: string;
  pincode?: string;
  allergies?: string;
  chronicConditions?: string;
  createdAt: string;
  appointments?: Appointment[];
  medicalRecords?: MedicalRecord[];
  prescriptions?: Prescription[];
  bills?: Bill[];
}

export interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  timeSlot: string;
  reasonForVisit: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vitalsNotes?: string;
  patient?: Patient;
  doctor?: Doctor;
  medicalRecord?: MedicalRecord;
}

export interface MedicalRecord {
  id: string;
  recordNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  clinicalNotes?: string;
  labResults?: string;
  recordedAt: string;
  patient?: Patient;
  doctor?: Doctor;
  prescription?: Prescription;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  category: string;
  dosageForm: string;
  strength: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  medicine?: Medicine;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  generalAdvice?: string;
  issuedAt: string;
  patient?: Patient;
  doctor?: Doctor;
  items: PrescriptionItem[];
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  type: 'GENERAL_WARD' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU' | 'EMERGENCY' | 'OPERATION_THEATRE';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  dailyRate: number;
  departmentId?: string;
  department?: Department;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  patientId: string;
  subTotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  paidAt?: string;
  createdAt: string;
  patient?: Patient;
  items?: BillItem[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PublicOverview {
  hospital: {
    name: string;
    tagline: string;
    phone: string;
    emergencyPhone: string;
    email: string;
    address: string;
    hours: string;
  };
  stats: {
    doctors: number;
    departments: number;
    rooms: number;
    availableRooms: number;
    medicines: number;
  };
  departments: Array<{
    id: string;
    name: string;
    code: string;
    description?: string;
    location?: string;
    doctorCount: number;
  }>;
  doctors: Array<{
    id: string;
    name: string;
    specialization: string;
    department?: string;
    experienceYears: number;
    consultationFee: number;
  }>;
}
