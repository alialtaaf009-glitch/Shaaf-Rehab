import * as React from 'react';
import { useState } from 'react';
import { 
  Plus, Calendar, CheckSquare, Clipboard, Users, ShieldCheck, 
  Search, FileText, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { Patient, PatientStatus, Admission, AdmissionType, AdmissionStatus } from '../types';

interface AdmissionsTabProps {
  patients: Patient[];
  admissions: Admission[];
  onAddPatient: (patient: Patient) => void;
  onAddAdmission: (patientId: string, admission: Admission) => void;
  onUpdatePatient: (id: string, updates: Partial<Patient>) => void;
}

export default function AdmissionsTab({
  patients,
  admissions,
  onAddPatient,
  onAddAdmission,
  onUpdatePatient
}: AdmissionsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'process'>('log');
  
  // Readmission Form states
  const [selectedDischargedId, setSelectedDischargedId] = useState<string>('');
  const [triageNotes, setTriageNotes] = useState('');
  const [detoxRequired, setDetoxRequired] = useState(true);
  const [signedConsent, setSignedConsent] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [relapseTrigger, setRelapseTrigger] = useState('Stress & Work Pressure');

  const dischargedPatients = patients.filter(p => p.status === PatientStatus.DISCHARGED);

  // Stats calculation
  const totalAdmissions = admissions.length;
  const readmissionCount = admissions.filter(a => a.type === AdmissionType.READMISSION).length;
  const readmitRate = totalAdmissions > 0 ? Math.round((readmissionCount / totalAdmissions) * 100) : 0;
  const activeInpatientsCount = patients.filter(p => p.status === PatientStatus.ACTIVE || p.status === PatientStatus.READMITTED).length;

  const handleProcessReadmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDischargedId) return;

    const patient = patients.find(p => p.id === selectedDischargedId);
    if (!patient) return;

    // Create admission log
    const newAdm: Admission = {
      id: `adm-${Date.now().toString().slice(-6)}`,
      patientId: selectedDischargedId,
      admissionDate: new Date().toISOString(),
      type: AdmissionType.READMISSION,
      triageNotes: `${triageNotes}\n[Primary Relapse Cause: ${relapseTrigger}]`,
      detoxRequired,
      status: AdmissionStatus.ADMITTED,
      signedConsent,
      createdAt: new Date().toISOString()
    };

    // Update patient status back to Readmitted and assign room
    onUpdatePatient(selectedDischargedId, {
      status: PatientStatus.READMITTED,
      room: newRoom || 'Detox Ward',
      admissionDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    onAddAdmission(selectedDischargedId, newAdm);

    // Reset Form
    setSelectedDischargedId('');
    setTriageNotes('');
    setNewRoom('');
    setSignedConsent(false);
    setActiveSubTab('log');
    alert(`Successfully processed readmission for ${patient.name}.`);
  };

  return (
    <div className="space-y-6" id="admissions-tab-container">
      
      {/* HIGHLIGHT STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="admissions-stats-bar">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-tight block">Active Inpatients</span>
            <span className="text-slate-900 font-sans font-black text-2xl block">{activeInpatientsCount}</span>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-tight block">Overall Logged Intakes</span>
            <span className="text-slate-900 font-sans font-black text-2xl block">{totalAdmissions}</span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700">
            <Clipboard size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-tight block">Relapse / Readmissions</span>
            <span className="text-slate-900 font-sans font-black text-2xl block">{readmissionCount}</span>
          </div>
          <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-tight block">Readmission Rate</span>
            <span className="text-slate-900 font-sans font-black text-2xl block">{readmitRate}%</span>
          </div>
          <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* DUAL INNER SECTIONS TOGGLER */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6" id="admissions-inner-dashboard">
        <div className="flex border-b border-slate-100 pb-4 justify-between items-center" id="admissions-subtab-navigation">
          <div className="flex bg-slate-50 p-1 rounded-2xl">
            <button
              id="subtab-log-btn"
              onClick={() => setActiveSubTab('log')}
              className={`px-4 py-2 font-sans font-semibold text-xs rounded-xl transition ${
                activeSubTab === 'log' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admission Logs
            </button>
            <button
              id="subtab-process-btn"
              onClick={() => {
                setActiveSubTab('process');
                if (dischargedPatients.length > 0) {
                  setSelectedDischargedId(dischargedPatients[0].id);
                }
              }}
              className={`px-4 py-2 font-sans font-semibold text-xs rounded-xl transition ${
                activeSubTab === 'process' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Process Readmission
            </button>
          </div>

          <p className="text-xs font-sans text-slate-500 hidden md:block">
            All intakes require signed consent and detoxification review.
          </p>
        </div>

        {/* CONTROLLERS ROUTING */}
        <div className="pt-6" id="admissions-content-renderer">
          {activeSubTab === 'log' ? (
            
            // ADMISSIONS HISTORY CARD LIST
            <div className="space-y-4" id="admissions-history-timeline">
              <h3 className="font-sans font-bold text-slate-800 text-sm">Historic Center Enrollment Registry</h3>
              
              <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-slate-50/50" id="admissions-table-container">
                <table className="w-full text-left font-sans text-xs text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-100/50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-4">Enrollment ID</th>
                      <th className="p-4">Patient Name</th>
                      <th className="p-4">Intake Date</th>
                      <th className="p-4">Log Type</th>
                      <th className="p-4">Detox Required</th>
                      <th className="p-4">Safety Consent</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admissions.map(adm => {
                      const patient = patients.find(p => p.id === adm.patientId);
                      return (
                        <tr key={adm.id} className="hover:bg-slate-50 transition" id={`adm-row-${adm.id}`}>
                          <td className="p-4 font-mono font-medium text-slate-800">{adm.id}</td>
                          <td className="p-4">
                            <span className="font-semibold block">{patient ? patient.name : 'Unknown Patient'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {adm.patientId}</span>
                          </td>
                          <td className="p-4">{new Date(adm.admissionDate).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              adm.type === AdmissionType.READMISSION ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {adm.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              adm.detoxRequired ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {adm.detoxRequired ? 'Detox Ward' : 'Counseling Standard'}
                            </span>
                          </td>
                          <td className="p-4">
                            {adm.signedConsent ? (
                              <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[11px]">
                                <ShieldCheck size={14} /> Signed Yes
                              </span>
                            ) : (
                              <span className="text-rose-500 font-semibold text-[11px]">No Signed Record</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border text-slate-700">
                              {adm.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          ) : (
            
            // PROCESS READMISSION WORKFLOW
            <div className="max-w-xl mx-auto space-y-4" id="readmission-flow-designer">
              <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl flex gap-3 text-amber-900 text-xs leading-relaxed" id="readmission-info-panel">
                <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="font-bold block">Relapse & Readmission Management Guidelines</span>
                  <p className="mt-0.5">Under the clinical policy of Shaaf Addiction Center, readmissions must go through a deep intake assessment. Document physical tremors, relapse stressors, and immediately secure signed liability consent documents before assigning crisis beds.</p>
                </div>
              </div>

              {dischargedPatients.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border" id="no-discharged-patients">
                  <Users className="mx-auto text-slate-300" size={32} />
                  <p className="font-sans text-xs text-slate-500 mt-2">There are currently no discharged patient chart profiles eligible for readmission triage.</p>
                </div>
              ) : (
                <form onSubmit={handleProcessReadmission} className="space-y-4 bg-white border border-slate-100 p-6 rounded-3xl" id="readmission-intake-form">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Patient Record *</label>
                    <select
                      id="readmit-patient-select"
                      className="w-full text-xs font-sans py-2.5 px-3 border border-slate-200 rounded-xl"
                      value={selectedDischargedId}
                      onChange={e => setSelectedDischargedId(e.target.value)}
                    >
                      {dischargedPatients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Previously: {p.substance})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Crisis Room / Bed *</label>
                      <input
                        id="readmit-room-input"
                        type="text"
                        required
                        placeholder="e.g. Detox Ward 1B"
                        className="w-full text-xs font-sans py-2 px-3 border border-slate-200 rounded-xl"
                        value={newRoom}
                        onChange={e => setNewRoom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Trigger Cause *</label>
                      <select
                        id="readmit-trigger-select"
                        className="w-full text-xs font-sans py-2 px-3 border border-slate-200 rounded-xl"
                        value={relapseTrigger}
                        onChange={e => setRelapseTrigger(e.target.value)}
                      >
                        <option>Stress & Work Pressure</option>
                        <option>Social Peer Pressures</option>
                        <option>Emotional / Family Grief</option>
                        <option>Chronic Pain Medication Trigger</option>
                        <option>Environment Relapse Vulnerability</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Intake & Triage Case Notes *</label>
                    <textarea
                      id="readmit-notes-textarea"
                      required
                      rows={3}
                      placeholder="Record patient physical assessment details, alcohol levels or substance timeline, anxiety indices, etc..."
                      className="w-full text-xs font-sans py-2.5 px-3 border border-slate-200 rounded-xl"
                      value={triageNotes}
                      onChange={e => setTriageNotes(e.target.value)}
                    />
                  </div>

                  {/* Detox indicator and Consent signoffs */}
                  <div className="space-y-2.5 pt-2" id="admission-checklists">
                    <label className="flex items-center gap-2 text-xs font-sans text-slate-800" id="detox-checkbox-label">
                      <input
                        id="detox-required-checkbox"
                        type="checkbox"
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={detoxRequired}
                        onChange={e => setDetoxRequired(e.target.checked)}
                      />
                      <span>Inpatient physical detoxification requires immediate medication protocols.</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-sans text-slate-800" id="consent-checkbox-label">
                      <input
                        id="signed-consent-checkbox"
                        type="checkbox"
                        required
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={signedConsent}
                        onChange={e => setSignedConsent(e.target.checked)}
                      />
                      <span className="font-semibold text-rose-600">Patient has signed rehabilitation facility guidelines consent terms. *</span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3" id="readmission-form-actions">
                    <button
                      id="cancel-readmission-btn"
                      type="button"
                      onClick={() => setActiveSubTab('log')}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-xl hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      id="submit-readmission-btn"
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-slate-900 border border-slate-800 text-white rounded-xl hover:bg-slate-800 transition shadow-sm"
                    >
                      Submit Intake Records
                    </button>
                  </div>
                </form>
              )}
            </div>

          )}
        </div>

      </div>

    </div>
  );
}
