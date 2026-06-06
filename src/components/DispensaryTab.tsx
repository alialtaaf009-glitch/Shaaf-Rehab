import { useState } from 'react';
import { 
  Pill, Clock, Check, AlertCircle, Calendar, User, Search,
  CheckCircle2, AlertOctagon, HelpCircle, ShieldCheck
} from 'lucide-react';
import { Patient, Medication, MedicationLog, AdministeredStatus, MedicationTime } from '../types';

interface DispensaryTabProps {
  patients: Patient[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  onAdministerMedication: (patientId: string, log: MedicationLog) => void;
}

export default function DispensaryTab({
  patients,
  medications,
  medicationLogs,
  onAdministerMedication
}: DispensaryTabProps) {
  const [selectedShift, setSelectedShift] = useState<MedicationTime>(MedicationTime.MORNING);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicianName, setClinicianName] = useState('Staff Nurse Yasir');

  // Find all active patient prescription schemas
  const activePatients = patients.filter(p => p.status !== 'discharged');
  
  // Current calendar date (YYYY-MM-DD format based on UTC 2026-06-06 context)
  const currentDateStr = "2026-06-06";

  // Filter patient prescriptions matching selected shift (Time of Day)
  const shiftMeds = medications.filter(m => m.timeOfDay === selectedShift && m.status === 'active');

  // Stats calculation
  const totalShiftDoses = shiftMeds.length;
  const shiftLogs = medicationLogs.filter(l => l.date === currentDateStr && shiftMeds.some(m => m.id === l.medicationId));
  const takenDoses = shiftLogs.filter(l => l.status === AdministeredStatus.TAKEN).length;
  const missedDoses = shiftLogs.filter(l => l.status === AdministeredStatus.MISSED).length;
  const pendingDoses = totalShiftDoses - (takenDoses + missedDoses);

  const handleAdministerAction = (patientId: string, medicationId: string, status: AdministeredStatus) => {
    const existingLog = medicationLogs.find(
      l => l.patientId === patientId && l.medicationId === medicationId && l.date === currentDateStr
    );

    const logUpdate: MedicationLog = {
      id: existingLog?.id || `log-${Date.now().toString().slice(-6)}`,
      patientId,
      medicationId,
      date: currentDateStr,
      status,
      administeredAt: status === AdministeredStatus.TAKEN ? new Date().toISOString() : undefined,
      takenBy: status === AdministeredStatus.TAKEN ? clinicianName : undefined
    };

    onAdministerMedication(patientId, logUpdate);
  };

  return (
    <div className="space-y-6" id="dispensary-system-container">
      
      {/* HEADER SECTION & SHIFT SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-xs" id="dispensary-toolbar">
        <div>
          <h2 className="font-sans font-bold text-slate-800 text-lg">Daily Medication Administration Record (MAR)</h2>
          <p className="font-sans text-xs text-slate-500 mt-1">Dispensing records for date: <span className="font-mono font-bold">{currentDateStr}</span></p>
        </div>

        <div className="flex items-center gap-2" id="clinician-credential-pill">
          <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Active Clinician Sign-off:</span>
          <input
            id="clinician-sign-input"
            type="text"
            className="bg-slate-50 font-sans text-xs border rounded-xl py-1 px-3 text-slate-800 w-44 font-semibold"
            value={clinicianName}
            onChange={e => setClinicianName(e.target.value)}
          />
        </div>
      </div>

      {/* SHIFT HIGHLIGHT METRICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="dispensary-shift-stats">
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black font-sans block">Pending shift doses</span>
            <span className="text-slate-800 font-bold block text-sm">{pendingDoses} prescriptions</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black font-sans block">Successfully Taken</span>
            <span className="text-emerald-700 font-bold block text-sm">{takenDoses} administered</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
            <AlertOctagon size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black font-sans block">Missed Warnings</span>
            <span className="text-rose-700 font-bold block text-sm">{missedDoses} missed</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-slate-900 rounded-xl">
            <ShieldCheck size={18} className="text-emerald-700" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black font-sans block">Sign-off Compliance</span>
            <span className="text-slate-800 font-bold block text-sm">
              {totalShiftDoses > 0 ? Math.round((takenDoses / totalShiftDoses) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* SHIFT REGIMEN TAB SELECTION */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6" id="shifts-dispensary-grid">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4" id="shifts-toolbar">
          <div className="flex bg-slate-50 p-1 rounded-2xl" id="shift-subnav">
            {Object.values(MedicationTime).map(shift => (
              <button
                id={`shift-tab-${shift}`}
                key={shift}
                onClick={() => setSelectedShift(shift)}
                className={`px-4 py-2 font-sans font-semibold text-xs rounded-xl transition capitalize ${
                  selectedShift === shift ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {shift} Shift
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              id="dispensary-patient-search"
              type="text"
              placeholder="Search patients..."
              className="pl-9 pr-4 py-1.5 text-xs font-sans bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 w-52"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ACTIVE SHIFT PRESCRIPTION LOGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="dispensary-roster-canvas">
          {shiftMeds.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-slate-50 border border-dashed rounded-2xl text-slate-500 text-xs font-sans" id="empty-shift-meds">
              <Pill className="mx-auto text-slate-300 mb-2" size={32} />
              No active patient medications scheduled during the {selectedShift} shift.
            </div>
          ) : (
            shiftMeds
              .filter(m => {
                const pat = patients.find(p => p.id === m.patientId);
                return pat && pat.name.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .map(med => {
                const patient = patients.find(p => p.id === med.patientId);
                const currentLog = medicationLogs.find(
                  l => l.patientId === med.patientId && l.medicationId === med.id && l.date === currentDateStr
                );

                const isTaken = currentLog?.status === AdministeredStatus.TAKEN;
                const isMissed = currentLog?.status === AdministeredStatus.MISSED;
                const isPending = !currentLog || currentLog.status === AdministeredStatus.PENDING;

                if (!patient) return null;

                return (
                  <div key={med.id} className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col justify-between space-y-4" id={`dispense-card-${med.id}`}>
                    <div className="space-y-3">
                      {/* Patient metadata header */}
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <h4 className="font-sans font-bold text-xs text-slate-800 truncate">{patient.name}</h4>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{patient.room}</span>
                        </div>
                        <span className="text-[9px] font-sans bg-slate-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {patient.status}
                        </span>
                      </div>

                      {/* Med details */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-start gap-3">
                        <div className="p-1.5 bg-white border border-slate-100 rounded-xl shrink-0 text-slate-600">
                          <Pill size={14} />
                        </div>
                        <div>
                          <p className="font-sans font-bold text-xs text-slate-800 leading-tight">{med.medName}</p>
                          <p className="font-sans text-[10px] text-slate-500 mt-1">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                    </div>

                    {/* Administration log action options */}
                    <div className="pt-2 border-t border-slate-50" id={`dispense-actions-${med.id}`}>
                      {isTaken && (
                        <div className="bg-emerald-50 border border-emerald-100/50 p-2.5 rounded-2xl flex items-center justify-between" id={`taken-badge-${med.id}`}>
                          <div className="flex items-center gap-1.5 text-emerald-800">
                            <Check className="text-emerald-600 stroke-[3]" size={14} />
                            <span className="text-[10px] font-sans font-bold">Administered Done</span>
                          </div>
                          <button
                            id={`undo-med-btn-${med.id}`}
                            onClick={() => handleAdministerAction(patient.id, med.id, AdministeredStatus.PENDING)}
                            className="text-[9px] font-sans font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Reset
                          </button>
                        </div>
                      )}

                      {isMissed && (
                        <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-2xl flex items-center justify-between" id={`missed-badge-${med.id}`}>
                          <div className="flex items-center gap-1.5 text-rose-800">
                            <AlertCircle className="text-rose-600" size={14} />
                            <span className="text-[10px] font-sans font-bold">Dose Was Missed</span>
                          </div>
                          <button
                            id={`undo-missed-btn-${med.id}`}
                            onClick={() => handleAdministerAction(patient.id, med.id, AdministeredStatus.PENDING)}
                            className="text-[9px] font-sans font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Reset
                          </button>
                        </div>
                      )}

                      {isPending && (
                        <div className="grid grid-cols-2 gap-2" id={`pending-actions-${med.id}`}>
                          <button
                            id={`mark-missed-btn-${med.id}`}
                            onClick={() => handleAdministerAction(patient.id, med.id, AdministeredStatus.MISSED)}
                            className="py-1.5 px-2 font-sans font-semibold text-[10px] border border-rose-100 hover:bg-rose-50/50 text-rose-600 rounded-xl transition duration-150"
                          >
                            Mark Missed
                          </button>
                          <button
                            id={`mark-taken-btn-${med.id}`}
                            onClick={() => handleAdministerAction(patient.id, med.id, AdministeredStatus.TAKEN)}
                            className="py-1.5 px-2 font-sans font-bold text-[10px] bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition duration-150 shadow-xs"
                          >
                            Administer Taken
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

    </div>
  );
}
