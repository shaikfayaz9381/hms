import {
  User,
  Patient,
  Doctor,
  Department,
  Appointment,
  MedicalRecord,
  Prescription,
  Medicine,
  Room,
  Bill,
  AuditLog,
  PublicOverview,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('medpulse_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('medpulse_token', token);
  } else {
    localStorage.removeItem('medpulse_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    contactNumber: string;
    emergencyContact?: string;
    address?: string;
    pincode?: string;
    allergies?: string;
    chronicConditions?: string;
  }): Promise<{ message: string; user: { id: string; email: string; role: string; firstName: string; lastName: string }; patient: { id: string; medicalRecordNumber: string } }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  // Patients
  async getPatients(params?: { search?: string; gender?: string; bloodGroup?: string }): Promise<Patient[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.gender) query.set('gender', params.gender);
    if (params?.bloodGroup) query.set('bloodGroup', params.bloodGroup);
    const qs = query.toString();
    return request<Patient[]>(`/patients${qs ? `?${qs}` : ''}`);
  },

  async getPatient(id: string): Promise<Patient> {
    return request<Patient>(`/patients/${id}`);
  },

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient> {
    return request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  },

  // Doctors & Departments
  async getDoctors(departmentId?: string): Promise<Doctor[]> {
    const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
    return request<Doctor[]>(`/doctors${qs}`);
  },

  async getDepartments(): Promise<Department[]> {
    return request<Department[]>('/doctors/departments');
  },

  // Appointments
  async getAppointments(filters?: { doctorId?: string; patientId?: string; status?: string; date?: string }): Promise<Appointment[]> {
    const query = new URLSearchParams();
    if (filters?.doctorId) query.set('doctorId', filters.doctorId);
    if (filters?.patientId) query.set('patientId', filters.patientId);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.date) query.set('date', filters.date);
    const qs = query.toString();
    return request<Appointment[]>(`/appointments${qs ? `?${qs}` : ''}`);
  },

  async createAppointment(appointmentData: {
    patientId: string;
    doctorId: string;
    scheduledAt: string;
    timeSlot: string;
    reasonForVisit: string;
    vitalsNotes?: string;
  }): Promise<Appointment> {
    return request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Medical Records
  async getMedicalRecords(params?: { patientId?: string; doctorId?: string }): Promise<MedicalRecord[]> {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.doctorId) query.set('doctorId', params.doctorId);
    const qs = query.toString();
    return request<MedicalRecord[]>(`/medical-records${qs ? `?${qs}` : ''}`);
  },

  async createMedicalRecord(recordData: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    chiefComplaint: string;
    diagnosis: string;
    treatmentPlan: string;
    clinicalNotes?: string;
    labResults?: string;
  }): Promise<MedicalRecord> {
    return request<MedicalRecord>('/medical-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  },

  // Prescriptions & Medicines
  async getPrescriptions(params?: { patientId?: string; doctorId?: string }): Promise<Prescription[]> {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.doctorId) query.set('doctorId', params.doctorId);
    const qs = query.toString();
    return request<Prescription[]>(`/prescriptions${qs ? `?${qs}` : ''}`);
  },

  async createPrescription(prescriptionData: {
    patientId: string;
    doctorId: string;
    medicalRecordId?: string;
    generalAdvice?: string;
    items: Array<{
      medicineId: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
      quantity: number;
    }>;
  }): Promise<Prescription> {
    return request<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  },

  async getMedicines(): Promise<Medicine[]> {
    return request<Medicine[]>('/prescriptions/medicines');
  },

  async createMedicine(data: Partial<Medicine>): Promise<Medicine> {
    return request<Medicine>('/prescriptions/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMedicineStock(id: string, delta: number): Promise<Medicine> {
    return request<Medicine>(`/prescriptions/medicines/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ delta }),
    });
  },

  // Rooms
  async getRooms(): Promise<Room[]> {
    return request<Room[]>('/rooms');
  },

  async updateRoomStatus(id: string, status: string): Promise<Room> {
    return request<Room>(`/rooms/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Billing
  async getBills(params?: { patientId?: string; status?: string }): Promise<Bill[]> {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<Bill[]>(`/bills${qs ? `?${qs}` : ''}`);
  },

  async createBill(data: {
    patientId: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
    discount?: number;
    notes?: string;
  }): Promise<Bill> {
    return request<Bill>('/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async payBill(id: string): Promise<{ message: string; bill: Bill }> {
    return request<{ message: string; bill: Bill }>(`/bills/${id}/pay`, {
      method: 'PUT',
    });
  },

  // Reports & System
  async getDashboardStatistics(): Promise<any> {
    return request<any>('/reports/dashboard');
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/reports/audit-logs');
  },

  // Public hospital website content (no authentication required)
  async getPublicOverview(): Promise<PublicOverview> {
    return request<PublicOverview>('/public/overview');
  },
};
