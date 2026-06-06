import { useState, useEffect } from 'react';
import { 
  Heart, Users, ClipboardList, Settings, Sparkles, AlertCircle,
  TrendingUp, Pill, LogIn, LogOut, CheckCircle, Home
} from 'lucide-react';
import { 
  Patient, Admission, ProgressLog, Medication, MedicationLog, 
  PatientStatus, AdmissionType, AdmissionStatus, MedicationTime, MedicationStatus, AdministeredStatus 
} from './types';
import { 
  offlineDb, 
  auth, 
  loginWithGoogle, 
  completeRedirectLogin,
  isStaffUser,
  logoutUser, 
  getLivePatients, 
  addLivePatient, 
  updateLivePatient,
  addLiveAdmission,
  addLiveProgress,
  addLiveMedication,
  addLiveMedicationLog
} from './lib/firebase';
import PatientsTab from './components/PatientsTab';
import AdmissionsTab from './lib/AdmissionsTab';
import ProgressTab from './components/ProgressTab';
import DispensaryTab from './components/DispensaryTab';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'admissions' | 'vitals' | 'dispensary'>('overview');
  
  // App Core States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  
  // Syncing & Auth state
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Load initial content from offline database fallback on boot
  useEffect(() => {
    offlineDb.initializeLocalStorage();
    setPatients(offlineDb.getPatients());
    setAdmissions(offlineDb.getAdmissions());
    setProgressLogs(offlineDb.getProgress());
    setMedications(offlineDb.getMedications());
    setMedicationLogs(offlineDb.getMedicationLogs());

    // Complete any pending redirect-based sign-in (mobile / APK path)
    completeRedirectLogin();

    // Listen to Firebase auth changes safely
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Enforce staff-only access: the user must have a staff/{uid} record.
        const staff = await isStaffUser(user.uid);
        if (!staff) {
          setAccessDenied(true);
          setFirebaseUser(null);
          setIsCloudSync(false);
          logoutUser();
          return;
        }
        setAccessDenied(false);
        setFirebaseUser(user);
        setIsCloudSync(true);
        loadFirebaseData();
      } else {
        setFirebaseUser(null);
        setIsCloudSync(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Firestore content if authenticated
  const loadFirebaseData = async () => {
    setLoading(true);
    try {
      const livePatients = await getLivePatients();
      if (livePatients.length > 0) {
        setPatients(livePatients);
      }
    } catch (err) {
      console.error("Using offline state fallback due to rules or connection setup:", err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // STATE WRITING HANDLERS (Saves to current mode: Cloud or Local)
  // -----------------------------------------------------------------

  const handleAddPatient = async (newPatient: Patient) => {
    const updated = [newPatient, ...patients];
    setPatients(updated);
    offlineDb.savePatients(updated);

    // Save admission registry line as well
    const defaultAdmission: Admission = {
      id: `adm-${Date.now().toString().slice(-6)}`,
      patientId: newPatient.id,
      admissionDate: newPatient.admissionDate,
      type: AdmissionType.NEW,
      detoxRequired: false,
      status: AdmissionStatus.ADMITTED,
      signedConsent: true,
      createdAt: new Date().toISOString()
    };
    const updatedAdmissions = [defaultAdmission, ...admissions];
    setAdmissions(updatedAdmissions);
    offlineDb.saveAdmissions(updatedAdmissions);

    if (isCloudSync) {
      try {
        await addLivePatient(newPatient);
        await addLiveAdmission(newPatient.id, defaultAdmission);
      } catch (err) {
        console.warn("Cloud write failed, maintained locally", err);
      }
    }
  };

  const handleUpdatePatient = async (id: string, updates: Partial<Patient>) => {
    const updated = patients.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    setPatients(updated);
    offlineDb.savePatients(updated);

    if (isCloudSync) {
      try {
        await updateLivePatient(id, updates);
      } catch (err) {
        console.warn("Cloud write failed", err);
      }
    }
  };

  const handleDeletePatient = (id: string) => {
    const updated = patients.filter(p => p.id !== id);
    setPatients(updated);
    offlineDb.savePatients(updated);
  };

  const handleAddAdmission = async (patientId: string, admission: Admission) => {
    const updated = [admission, ...admissions];
    setAdmissions(updated);
    offlineDb.saveAdmissions(updated);

    if (isCloudSync) {
      try {
        await addLiveAdmission(patientId, admission);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleAddProgressLog = async (patientId: string, log: ProgressLog) => {
    const updated = [log, ...progressLogs];
    setProgressLogs(updated);
    offlineDb.saveProgress(updated);

    if (isCloudSync) {
      try {
        await addLiveProgress(patientId, log);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleAddMedication = async (patientId: string, med: Medication) => {
    const updated = [med, ...medications];
    setMedications(updated);
    offlineDb.saveMedications(updated);

    if (isCloudSync) {
      try {
        await addLiveMedication(patientId, med);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleAdministerMedication = async (patientId: string, log: MedicationLog) => {
    const exists = medicationLogs.find(l => l.id === log.id);
    let updated;
    if (exists) {
      updated = medicationLogs.map(l => l.id === log.id ? log : l);
    } else {
      updated = [log, ...medicationLogs];
    }
    setMedicationLogs(updated);
    offlineDb.saveMedicationLogs(updated);

    if (isCloudSync) {
      try {
        await addLiveMedicationLog(patientId, log);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleAuthenticate = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      await loginWithGoogle();
    } catch (err) {
      alert("Sign-in could not be completed. Please check your internet connection and that this device's account is authorized, then try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeauthenticate = async () => {
    await logoutUser();
    setIsCloudSync(false);
  };

  // General dashboard stats
  const activeInpatients = patients.filter(p => p.status === PatientStatus.ACTIVE || p.status === PatientStatus.READMITTED);
  const totalCompletedCount = patients.filter(p => p.status === PatientStatus.DISCHARGED).length;
  const totalBedsOcc = activeInpatients.length;
  const currentRiskAlertCount = patients.filter(p => p.status === PatientStatus.READMITTED).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased" id="clinic-root-view">

      {accessDenied && (
        <div className="bg-rose-600 text-white text-center text-xs font-sans font-semibold py-2 px-4" id="access-denied-banner">
          This account is not registered as Shaaf Rehab staff. Please sign in with an authorized staff account, or ask an administrator to grant you access.
        </div>
      )}
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="bg-slate-900 text-white py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-lg border-b border-slate-800 z-10" id="main-portal-header">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 bg-slate-800" id="crest-shield">
            <img src="/app_logo.png" alt="Shaaf Rehab logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-[#f1f5f9] tracking-tight text-base leading-none">Shaaf Rehab</h1>
            <p className="font-sans text-emerald-300 text-sm leading-tight mt-1" dir="rtl" lang="ur">شاف ری ہیب اینڈ ایڈکشن سینٹر</p>
            <p className="text-[9px] text-slate-400 font-sans leading-tight mt-1">919 J2, Johar Town, Lahore &nbsp;•&nbsp; PHC# R-28998</p>
          </div>
        </div>

        {/* Database Sync status options */}
        <div className="flex items-center gap-3.5" id="authenticator-tray">
          <div className="flex items-center gap-2.5 bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-705 text-xs text-slate-300 font-sans" id="db-state-status">
            <span className={`h-2.5 w-2.5 rounded-full inline-block ${isCloudSync ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isCloudSync ? 'Cloud Sync Engaged' : 'Demo Sandbox Mode'}</span>
          </div>

          {firebaseUser ? (
            <div className="flex items-center gap-2.5" id="user-info-credentials">
              <span className="text-slate-300 text-xs font-sans leading-none font-semibold truncate max-w-32">{firebaseUser.displayName || firebaseUser.email}</span>
              <button
                id="sign-out-btn"
                onClick={handleDeauthenticate}
                className="flex items-center gap-1 bg-slate-805 hover:bg-slate-700 text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition"
              >
                <LogOut size={13} /> Log out
              </button>
            </div>
          ) : (
            <button
              id="google-login-btn"
              onClick={handleAuthenticate}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2 px-4 rounded-2xl transition shadow-xs"
            >
              <LogIn size={13} /> Google Sign In
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" id="dashboard-wrapper">
        
        {/* 2. SIDEBAR UTILITY NAVIDATION RAIL */}
        <nav className="w-full md:w-60 bg-white border-r border-slate-200 p-4 shrink-0 flex flex-col gap-1 overflow-y-auto" id="left-navbar-rail">
          <div className="text-[9px] uppercase font-bold text-slate-400 font-sans tracking-widest px-3.5 mb-2 block">Departments</div>

          <button
            id="nav-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-sans font-bold transition duration-150 ${
              activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Home size={16} /> Clinic Overview
          </button>

          <button
            id="nav-patients"
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-sans font-bold transition duration-150 ${
              activeTab === 'patients' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={16} /> Patient Directory
          </button>

          <button
            id="nav-admissions"
            onClick={() => setActiveTab('admissions')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-sans font-bold transition duration-150 ${
              activeTab === 'admissions' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardList size={16} /> Intakes & Admissions
          </button>

          <button
            id="nav-vitals"
            onClick={() => setActiveTab('vitals')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-sans font-bold transition duration-150 ${
              activeTab === 'vitals' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart size={16} /> Recovery Timelines
          </button>

          <button
            id="nav-dispensary"
            onClick={() => setActiveTab('dispensary')}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-sans font-bold transition duration-150 ${
              activeTab === 'dispensary' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Pill size={16} /> Dispensary Record
          </button>

          <div className="mt-auto pt-6 px-3.5" id="sidebar-footer">
            <span className="block text-[10px] text-slate-400 font-sans">Developed for Shaaf Rehab Portal 2026.</span>
          </div>
        </nav>

        {/* 3. MAIN WORKSPACE VIEW */}
        <main className="flex-1 overflow-y-auto p-6" id="main-workspace-section">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in" id="overview-department">
              
              {/* Top Banner Greetings */}
              <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" id="greetings-promotional-banner">
                <div className="space-y-1.5 z-10">
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 font-sans font-bold text-[10px] py-1 px-3.5 rounded-full uppercase tracking-widest">Administrative Hub</span>
                  <h2 className="font-sans font-extrabold text-[#f8fafc] text-xl leading-tight">Shaaf Rehabilitation Center clinical administration</h2>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed max-w-xl">Welcome back to the clinical record panel. Track active patients, trigger admissions, manage medication schedules, and check Counselor stability indicators in real-time.</p>
                </div>
                <div className="bg-emerald-500/10 h-32 w-32 rounded-full absolute -right-6 -bottom-6 blur-2xl"></div>
              </div>

              {/* OVERVIEW METRICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="overview-metrics-indicators">
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black font-sans block">Operational Inpatients</span>
                    <span className="text-slate-800 font-black text-2xl block font-mono">{totalBedsOcc}</span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <Users size={20} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black font-sans block">Successful Recoveries</span>
                    <span className="text-emerald-700 font-black text-2xl block font-mono">+{totalCompletedCount}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                    <CheckCircle size={20} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black font-sans block">Relapse Triggers logged</span>
                    <span className="text-amber-700 font-black text-2xl block font-mono">{currentRiskAlertCount}</span>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
                    <AlertCircle size={20} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black font-sans block">Pending Med shift</span>
                    <span className="text-slate-800 font-black text-xl block">MAR Ready</span>
                  </div>
                  <div className="p-3 bg-emerald-100 text-slate-900 rounded-2xl">
                    <Pill size={20} className="text-emerald-800" />
                  </div>
                </div>
              </div>

              {/* TWO COLUMN INTERACTIVE QUICK ACCESS PANEL */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overview-quick-tools">
                
                {/* Left Span 7 - Patient statuses highlights */}
                <div className="lg:col-span-7 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col space-y-4" id="direct-active-charts">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-sans font-bold text-slate-800 text-sm">Active Inpatients Recovery Checkpoint</h3>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5">Quick clinical metrics log view</p>
                    </div>
                    <button
                      id="view-directory-direct-btn"
                      onClick={() => setActiveTab('patients')}
                      className="text-emerald-600 hover:text-emerald-700 font-sans font-bold text-xs"
                    >
                      View Directory →
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]" id="quick-patientsui-list">
                    {patients.slice(0, 4).map(p => {
                      const logs = progressLogs.filter(l => l.patientId === p.id);
                      const latestDays = logs.length > 0 ? Math.max(...logs.map(l => l.sobrietyDay)) : 5;
                      return (
                        <div key={p.id} className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-center justify-between" id={`ov-row-${p.id}`}>
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-sans font-bold text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{p.room} • {p.substance}</span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="block font-sans font-black text-xs text-slate-950">{latestDays} Sober Days</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              p.status === PatientStatus.ACTIVE ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Span 5 - Therapeutic Activities and quick-admissions navigation */}
                <div className="lg:col-span-5 space-y-4" id="direct-admissions-highlights">
                  <div className="bg-emerald-65/15 border border-emerald-100 p-6 rounded-3xl flex flex-col space-y-3.5" id="facility-details">
                    <h3 className="font-sans font-bold text-slate-850 text-sm flex items-center gap-1.5 leading-none">
                      <Sparkles className="text-emerald-600" size={16} /> Clinical Capacity Alert
                    </h3>
                    <p className="text-xs text-slate-600 font-sans leading-relaxed">Shaaf center accommodation beds are currently at safe operating ratios. Utilize the Intake module to quickly book newly seeking registrants or handle relapse candidates.</p>
                    
                    <button
                      id="overview-to-intake-btn"
                      onClick={() => setActiveTab('admissions')}
                      className="py-2 px-4 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl shadow-xs transition duration-150 text-center"
                    >
                      Process Intake Now
                    </button>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100/50 p-6 rounded-3xl flex flex-col space-y-3" id="facility-info-card">
                    <h3 className="font-sans font-bold text-indigo-950 text-sm">Facility</h3>
                    <p className="text-xs text-indigo-700 font-sans leading-relaxed">Shaaf Rehabilitation and Addiction Center<br/>919 J2, Johar Town, Lahore<br/>Punjab Healthcare Commission Reg. No. PHC# R-28998</p>
                    <button
                      id="overview-to-patients-btn"
                      onClick={() => setActiveTab('patients')}
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl transition text-center shadow-xs"
                    >
                      Go to Patient Directory
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <PatientsTab
              patients={patients}
              medications={medications}
              progressLogs={progressLogs}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
              onAddMedication={handleAddMedication}
              onAddProgressLog={handleAddProgressLog}
            />
          )}

          {activeTab === 'admissions' && (
            <AdmissionsTab
              patients={patients}
              admissions={admissions}
              onAddPatient={handleAddPatient}
              onAddAdmission={handleAddAdmission}
              onUpdatePatient={handleUpdatePatient}
            />
          )}

          {activeTab === 'vitals' && (
            <ProgressTab
              patients={patients}
              progressLogs={progressLogs}
            />
          )}

          {activeTab === 'dispensary' && (
            <DispensaryTab
              patients={patients}
              medications={medications}
              medicationLogs={medicationLogs}
              onAdministerMedication={handleAdministerMedication}
            />
          )}

        </main>
      </div>
    </div>
  );
}
