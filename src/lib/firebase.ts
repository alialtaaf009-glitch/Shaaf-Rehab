import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';
import { Patient, Admission, ProgressLog, Medication, MedicationLog, PatientStatus, AdmissionType, AdmissionStatus, MedicationTime, MedicationStatus, AdministeredStatus } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

// 1. Initialize Firebase App
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// --- ACCESS CONTROL ---
// Access is restricted to staff. A user is "staff" if a document exists at
// staff/{their-uid} in Firestore. You manage staff by adding/removing those
// documents (from the Firebase console or an in-app admin screen) WITHOUT
// needing to redeploy the app. The real enforcement lives in firestore.rules,
// which checks the same staff/{uid} document.
export async function isStaffUser(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return false;
  try {
    const snap = await getDoc(doc(db, 'staff', uid));
    return snap.exists();
  } catch (err) {
    console.error('Staff check failed:', err);
    return false;
  }
}

// Error handler specified by firebase-integration skill
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection to confirm rules and service are live
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    return false;
  }
}

// Pre-seeded clinical mockup dataset for Shaaf Rehab
export const SEED_PATIENTS: Patient[] = [
  {
    id: "p-ali-001",
    name: "Muhammad Ali Siddiqui",
    age: 29,
    gender: "Male",
    contact: "+92 300 1234567",
    emergencyContact: "Fatima Siddiqui (Mother) - +92 321 9876543",
    substance: "Heroin & Opioids",
    admissionDate: "2026-05-20T10:00:00Z",
    status: PatientStatus.ACTIVE,
    room: "Ward A - Bed 3",
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-06-05T18:30:00Z"
  },
  {
    id: "p-ayesha-002",
    name: "Ayesha Khan",
    age: 34,
    gender: "Female",
    contact: "+92 312 4567890",
    emergencyContact: "Tariq Khan (Husband) - +92 333 5556677",
    substance: "Alcohol & Sedatives",
    admissionDate: "2026-04-12T09:00:00Z",
    status: PatientStatus.ACTIVE,
    room: "Private Suite 2",
    createdAt: "2026-04-12T09:00:00Z",
    updatedAt: "2026-06-05T17:00:00Z"
  },
  {
    id: "p-zain-003",
    name: "Zain Mehta",
    age: 23,
    gender: "Male",
    contact: "+92 345 8881234",
    emergencyContact: "Farid Mehta (Father) - +92 311 2223344",
    substance: "Methamphetamine (Ice)",
    admissionDate: "2026-06-01T14:30:00Z",
    status: PatientStatus.READMITTED,
    room: "Detox Facility Unit 1",
    createdAt: "2026-06-01T14:30:00Z",
    updatedAt: "2026-06-05T15:20:00Z"
  },
  {
    id: "p-fatima-004",
    name: "Fatima Bibi",
    age: 46,
    gender: "Female",
    contact: "+92 302 7779900",
    emergencyContact: "Bilal Ahmed (Son) - +92 303 1112223",
    substance: "Prescription Anxiolytics",
    admissionDate: "2026-03-01T11:00:00Z",
    status: PatientStatus.DISCHARGED,
    room: "Discharged / Outpatient",
    createdAt: "2026-03-01T11:00:00Z",
    updatedAt: "2026-05-30T16:00:00Z"
  }
];

export const SEED_ADMISSIONS: Admission[] = [
  {
    id: "adm-001",
    patientId: "p-ali-001",
    admissionDate: "2026-05-20T10:00:00Z",
    type: AdmissionType.NEW,
    triageNotes: "Patient presented with severe physical withdrawal. Reported 5 years of dependency. Moderate dehydration. Cleared for inpatient stabilization after medical review.",
    detoxRequired: true,
    status: AdmissionStatus.ADMITTED,
    signedConsent: true,
    createdAt: "2026-05-20T10:05:00Z"
  },
  {
    id: "adm-002",
    patientId: "p-ayesha-002",
    admissionDate: "2026-04-12T09:00:00Z",
    type: AdmissionType.NEW,
    triageNotes: "Self-referred. High anxiety states, history of binge alcohol intake as trauma response. Signed all counseling agreements with full support of spouse.",
    detoxRequired: false,
    status: AdmissionStatus.ADMITTED,
    signedConsent: true,
    createdAt: "2026-04-12T09:10:00Z"
  },
  {
    id: "adm-003",
    patientId: "p-zain-003",
    admissionDate: "2026-06-01T14:30:00Z",
    type: AdmissionType.READMISSION,
    triageNotes: "Readmission following 2 weeks relapse outside. Triggered by peer pressure. Shows strong motivation to restart program immediately. High heart rate upon arrival.",
    detoxRequired: true,
    status: AdmissionStatus.ADMITTED,
    signedConsent: true,
    createdAt: "2026-06-01T14:40:00Z"
  },
  {
    id: "adm-004",
    patientId: "p-fatima-004",
    admissionDate: "2026-03-01T11:00:00Z",
    type: AdmissionType.NEW,
    triageNotes: "Completes standard 90-day program. Successful cognitive behavioral therapy sessions. Gradual tapering completed.",
    detoxRequired: true,
    status: AdmissionStatus.DISCHARGED,
    signedConsent: true,
    createdAt: "2026-03-01T11:05:00Z"
  }
];

export const SEED_PROGRESS: ProgressLog[] = [
  // Muhammad Ali - Day 14 Sobriety
  {
    id: "prog-ali-1",
    patientId: "p-ali-001",
    date: "2026-06-02",
    sobrietyDay: 13,
    counselorNotes: "Muhammad Ali shows fantastic physical recovery. Engaged productively in morning group share. Disclosed deep triggers regarding career stress. Vitals normalized.",
    heartRate: 72,
    bloodPressure: "120/80",
    temperature: 98.4,
    mood: 8,
    sleep: 7.5,
    createdAt: "2026-06-02T19:00:00Z",
    updatedAt: "2026-06-02T19:00:00Z"
  },
  {
    id: "prog-ali-2",
    patientId: "p-ali-001",
    date: "2026-06-05",
    sobrietyDay: 16,
    counselorNotes: "Fitted well into peer interactions. Appetite is healthy, reports sleeping without nightmare triggers. Guided through grief journaling exercise. Highly receptive.",
    heartRate: 74,
    bloodPressure: "118/79",
    temperature: 98.6,
    mood: 9,
    sleep: 8.0,
    createdAt: "2026-06-05T18:30:00Z",
    updatedAt: "2026-06-05T18:30:00Z"
  },
  // Ayesha - Day 54 Sobriety
  {
    id: "prog-ayesha-1",
    patientId: "p-ayesha-002",
    date: "2026-06-03",
    sobrietyDay: 52,
    counselorNotes: "Active leader in counseling circles. Developing solid relapse prevention steps. Identified three core coping mechanisms: walking, sketching, and deep breathing.",
    heartRate: 68,
    bloodPressure: "115/75",
    temperature: 98.1,
    mood: 9,
    sleep: 8.5,
    createdAt: "2026-06-03T17:00:00Z",
    updatedAt: "2026-06-03T17:00:00Z"
  },
  // Zain - Day 4 Sobriety
  {
    id: "prog-zain-1",
    patientId: "p-zain-003",
    date: "2026-06-04",
    sobrietyDay: 3,
    counselorNotes: "Zain is currently completing acute physical detox safely under observation. Experienced heavy tremors and insomnia. Reassured him of clinical support. Stabilized with fluids.",
    heartRate: 98,
    bloodPressure: "140/92",
    temperature: 99.1,
    mood: 3,
    sleep: 4.0,
    createdAt: "2026-06-04T15:00:00Z",
    updatedAt: "2026-06-04T15:00:00Z"
  },
  {
    id: "prog-zain-2",
    patientId: "p-zain-003",
    date: "2026-06-05",
    sobrietyDay: 4,
    counselorNotes: "Tremors starting to fade. Successfully ingested liquid meal. Showed signs of spiritual determination to complete the process. Vitals slowly decreasing.",
    heartRate: 85,
    bloodPressure: "132/86",
    temperature: 98.7,
    mood: 5,
    sleep: 5.5,
    createdAt: "2026-06-05T15:20:00Z",
    updatedAt: "2026-06-05T15:20:00Z"
  }
];

export const SEED_MEDICATIONS: Medication[] = [
  {
    id: "med-ali-1",
    patientId: "p-ali-001",
    medName: "Buprenorphine (Subutex)",
    dosage: "8mg",
    frequency: "Once Daily",
    timeOfDay: MedicationTime.MORNING,
    startDate: "2026-05-20",
    status: MedicationStatus.ACTIVE,
    createdAt: "2026-05-20T10:15:00Z"
  },
  {
    id: "med-ali-2",
    patientId: "p-ali-001",
    medName: "Multivitamins B-Complex",
    dosage: "1 Capsule",
    frequency: "Once Daily",
    timeOfDay: MedicationTime.NIGHT,
    startDate: "2026-05-20",
    status: MedicationStatus.ACTIVE,
    createdAt: "2026-05-20T10:17:00Z"
  },
  {
    id: "med-ayesha-1",
    patientId: "p-ayesha-002",
    medName: "Naltrexone (ReVia)",
    dosage: "50mg",
    frequency: "Once Daily",
    timeOfDay: MedicationTime.MORNING,
    startDate: "2026-04-13",
    status: MedicationStatus.ACTIVE,
    createdAt: "2026-04-13T09:30:00Z"
  },
  {
    id: "med-zain-1",
    patientId: "p-zain-003",
    medName: "Clonidine",
    dosage: "0.1mg",
    frequency: "Every 12 hours",
    timeOfDay: MedicationTime.MORNING,
    startDate: "2026-06-01",
    status: MedicationStatus.ACTIVE,
    createdAt: "2026-06-01T15:00:00Z"
  },
  {
    id: "med-zain-2",
    patientId: "p-zain-003",
    medName: "Diazepam (Detox Taper)",
    dosage: "5mg",
    frequency: "At night",
    timeOfDay: MedicationTime.NIGHT,
    startDate: "2026-06-01",
    status: MedicationStatus.ACTIVE,
    createdAt: "2026-06-01T15:02:00Z"
  }
];

export const SEED_MEDICATION_LOGS: MedicationLog[] = [
  {
    id: "log-ali-01",
    patientId: "p-ali-001",
    medicationId: "med-ali-1",
    date: "2026-06-06",
    status: AdministeredStatus.TAKEN,
    administeredAt: "2026-06-06T08:15:00Z",
    takenBy: "Clinician Yasir"
  },
  {
    id: "log-ali-02",
    patientId: "p-ali-001",
    medicationId: "med-ali-2",
    date: "2026-06-06",
    status: AdministeredStatus.PENDING
  },
  {
    id: "log-ayesha-01",
    patientId: "p-ayesha-002",
    medicationId: "med-ayesha-1",
    date: "2026-06-06",
    status: AdministeredStatus.TAKEN,
    administeredAt: "2026-06-06T08:30:00Z",
    takenBy: "Clinician Yasir"
  },
  {
    id: "log-zain-01",
    patientId: "p-zain-003",
    medicationId: "med-zain-1",
    date: "2026-06-06",
    status: AdministeredStatus.TAKEN,
    administeredAt: "2026-06-06T08:45:00Z",
    takenBy: "Clinician Yasir"
  },
  {
    id: "log-zain-02",
    patientId: "p-zain-003",
    medicationId: "med-zain-2",
    date: "2026-06-06",
    status: AdministeredStatus.PENDING
  }
];

// Initialize local storage database
export function initializeLocalStorage() {
  if (!localStorage.getItem('shaaf_patients')) {
    localStorage.setItem('shaaf_patients', JSON.stringify(SEED_PATIENTS));
  }
  if (!localStorage.getItem('shaaf_admissions')) {
    localStorage.setItem('shaaf_admissions', JSON.stringify(SEED_ADMISSIONS));
  }
  if (!localStorage.getItem('shaaf_progress')) {
    localStorage.setItem('shaaf_progress', JSON.stringify(SEED_PROGRESS));
  }
  if (!localStorage.getItem('shaaf_medications')) {
    localStorage.setItem('shaaf_medications', JSON.stringify(SEED_MEDICATIONS));
  }
  if (!localStorage.getItem('shaaf_medication_logs')) {
    localStorage.setItem('shaaf_medication_logs', JSON.stringify(SEED_MEDICATION_LOGS));
  }
}

// Low-level LocalStorage operations
export const offlineDb = {
  initializeLocalStorage,
  getPatients: (): Patient[] => {
    initializeLocalStorage();
    return JSON.parse(localStorage.getItem('shaaf_patients') || '[]');
  },
  getAdmissions: (): Admission[] => {
    initializeLocalStorage();
    return JSON.parse(localStorage.getItem('shaaf_admissions') || '[]');
  },
  getProgress: (): ProgressLog[] => {
    initializeLocalStorage();
    return JSON.parse(localStorage.getItem('shaaf_progress') || '[]');
  },
  getMedications: (): Medication[] => {
    initializeLocalStorage();
    return JSON.parse(localStorage.getItem('shaaf_medications') || '[]');
  },
  getMedicationLogs: (): MedicationLog[] => {
    initializeLocalStorage();
    return JSON.parse(localStorage.getItem('shaaf_medication_logs') || '[]');
  },

  savePatients: (patients: Patient[]) => {
    localStorage.setItem('shaaf_patients', JSON.stringify(patients));
  },
  saveAdmissions: (admissions: Admission[]) => {
    localStorage.setItem('shaaf_admissions', JSON.stringify(admissions));
  },
  saveProgress: (progress: ProgressLog[]) => {
    localStorage.setItem('shaaf_progress', JSON.stringify(progress));
  },
  saveMedications: (medications: Medication[]) => {
    localStorage.setItem('shaaf_medications', JSON.stringify(medications));
  },
  saveMedicationLogs: (logs: MedicationLog[]) => {
    localStorage.setItem('shaaf_medication_logs', JSON.stringify(logs));
  }
};

// -------------------------------------------------------------
// FIREBASE LIVE IMPLEMENTATIONS
// -------------------------------------------------------------

// Patient Helpers
export async function getLivePatients(): Promise<Patient[]> {
  const path = 'patients';
  try {
    const q = collection(db, path);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function addLivePatient(patient: Patient): Promise<void> {
  const path = `patients/${patient.id}`;
  try {
    await setDoc(doc(db, 'patients', patient.id), patient);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateLivePatient(patientId: string, updates: Partial<Patient>): Promise<void> {
  const path = `patients/${patientId}`;
  try {
    await updateDoc(doc(db, 'patients', patientId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Admission Helpers
export async function addLiveAdmission(patientId: string, admission: Admission): Promise<void> {
  const path = `patients/${patientId}/admissions/${admission.id}`;
  try {
    await setDoc(doc(db, 'patients', patientId, 'admissions', admission.id), admission);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getLiveAdmissions(patientId: string): Promise<Admission[]> {
  const path = `patients/${patientId}/admissions`;
  try {
    const snap = await getDocs(collection(db, 'patients', patientId, 'admissions'));
    return snap.docs.map(d => d.data() as Admission);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

// Progress Helpers
export async function addLiveProgress(patientId: string, log: ProgressLog): Promise<void> {
  const path = `patients/${patientId}/progress/${log.id}`;
  try {
    await setDoc(doc(db, 'patients', patientId, 'progress', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getLiveProgressLogs(patientId: string): Promise<ProgressLog[]> {
  const path = `patients/${patientId}/progress`;
  try {
    const snap = await getDocs(collection(db, 'patients', patientId, 'progress'));
    return snap.docs.map(d => d.data() as ProgressLog);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

// Medication Helpers
export async function addLiveMedication(patientId: string, med: Medication): Promise<void> {
  const path = `patients/${patientId}/medications/${med.id}`;
  try {
    await setDoc(doc(db, 'patients', patientId, 'medications', med.id), med);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getLiveMedications(patientId: string): Promise<Medication[]> {
  const path = `patients/${patientId}/medications`;
  try {
    const snap = await getDocs(collection(db, 'patients', patientId, 'medications'));
    return snap.docs.map(d => d.data() as Medication);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function addLiveMedicationLog(patientId: string, log: MedicationLog): Promise<void> {
  const path = `patients/${patientId}/medicationLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'patients', patientId, 'medicationLogs', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getLiveMedicationLogs(patientId: string): Promise<MedicationLog[]> {
  const path = `patients/${patientId}/medicationLogs`;
  try {
    const snap = await getDocs(collection(db, 'patients', patientId, 'medicationLogs'));
    return snap.docs.map(d => d.data() as MedicationLog);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

// Combined Authentication Provider Helper.
// Tries popup first (works on desktop). If popup is blocked or unsupported
// (common inside the Android TWA/APK and many mobile browsers), falls back to
// a full-page redirect, which is the reliable path on mobile.
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const response = await signInWithPopup(auth, googleProvider);
    return response.user;
  } catch (error: any) {
    const code = error?.code || '';
    const popupUnsupported = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
      'auth/web-storage-unsupported',
    ].includes(code);

    if (popupUnsupported) {
      // Redirect away; result is picked up by completeRedirectLogin() on return.
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error('Sign in failed: ', error);
    throw error;
  }
}

// Call once on app boot to capture the result of a redirect sign-in.
export async function completeRedirectLogin(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error) {
    console.error('Redirect login completion failed: ', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
