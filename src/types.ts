export enum PatientStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  READMITTED = 'readmitted'
}

export enum AdmissionType {
  NEW = 'new',
  READMISSION = 'readmission'
}

export enum AdmissionStatus {
  ADMITTED = 'admitted',
  COMPLETED = 'completed',
  DISCHARGED = 'discharged'
}

export enum MedicationTime {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

export enum MedicationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued'
}

export enum AdministeredStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  PENDING = 'pending'
}

export interface Patient {
  id: string;
  enrollmentId?: string; // Human-facing enrollment / file number, editable
  name: string;
  age: number;
  gender: string;
  contact?: string;
  emergencyContact?: string;
  substance?: string; // e.g. "Alcohol", "Opioids", "Stimulants", "Gambling"
  admissionDate: string; // ISO DateTime
  status: PatientStatus;
  room?: string; // Bed allocation e.g., "Ward 1A - Bed 4"
  createdAt: string;
  updatedAt: string;
}

export interface Admission {
  id: string;
  patientId: string;
  admissionDate: string;
  type: AdmissionType;
  triageNotes?: string;
  detoxRequired: boolean;
  status: AdmissionStatus;
  signedConsent: boolean;
  createdAt: string;
}

export interface ProgressLog {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  sobrietyDay: number;
  counselorNotes: string;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  mood: number; // 1 to 10 scale
  sleep: number; // hours
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  medName: string;
  dosage: string; // e.g., "50mg"
  frequency: string; // e.g., "Once Daily", "Twice Daily"
  timeOfDay: MedicationTime;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  status: MedicationStatus;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  patientId: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  administeredAt?: string; // ISO Date of action
  status: AdministeredStatus;
  takenBy?: string; // Counselor / medical officer who administered
}
