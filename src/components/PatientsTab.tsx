import * as React from 'react';
import { useState } from 'react';
import { 
  User, Search, Filter, Plus, Home, Phone, AlertCircle, CheckCircle2, 
  Calendar, Award, Heart, Activity, FileText, Pill, Trash, Edit, Clock 
} from 'lucide-react';
import { Patient, PatientStatus, Medication, MedicationTime, MedicationStatus, ProgressLog } from '../types';

interface PatientsTabProps {
  patients: Patient[];
  medications: Medication[];
  progressLogs: ProgressLog[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (id: string, updates: Partial<Patient>) => void;
  onDeletePatient: (id: string) => void;
  onAddMedication: (patientId: string, med: Medication) => void;
  onAddProgressLog: (patientId: string, log: ProgressLog) => void;
}

export default function PatientsTab({
  patients,
  medications,
  progressLogs,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onAddMedication,
  onAddProgressLog
}: PatientsTabProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [substanceFilter, setSubstanceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selection / Form states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);

  // New Patient Form state
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(25);
  const [newGender, setNewGender] = useState('Male');
  const [newContact, setNewContact] = useState('');
  const [newEmergency, setNewEmergency] = useState('');
  const [newSubstance, setNewSubstance] = useState('');
  const [newRoom, setNewRoom] = useState('');

  // New Medication Form state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Once Daily');
  const [medTime, setMedTime] = useState<MedicationTime>(MedicationTime.MORNING);
  const [medStart, setMedStart] = useState(new Date().toISOString().split('T')[0]);

  // New Progress Form state
  const [progNotes, setProgNotes] = useState('');
  const [progHeartRate, setProgHeartRate] = useState(72);
  const [progBp, setProgBp] = useState('120/80');
  const [progTemp, setProgTemp] = useState(98.6);
  const [progMood, setProgMood] = useState(7);
  const [progSleep, setProgSleep] = useState(7);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const patientMeds = medications.filter(m => m.patientId === selectedPatientId);
  const patientLogs = progressLogs
    .filter(p => p.patientId === selectedPatientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Unique substances for filtering
  const substances = ['All', ...Array.from(new Set(patients.map(p => p.substance).filter(Boolean)))];

  // Filtering Logic
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.room && p.room.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubstance = substanceFilter === 'All' || p.substance === substanceFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesSubstance && matchesStatus;
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPatient: Patient = {
      id: `p-${Date.now().toString().slice(-6)}`,
      name: newName,
      age: Number(newAge),
      gender: newGender,
      contact: newContact || undefined,
      emergencyContact: newEmergency || undefined,
      substance: newSubstance || 'Undisclosed',
      admissionDate: new Date().toISOString(),
      status: PatientStatus.ACTIVE,
      room: newRoom || 'Unassigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddPatient(newPatient);
    setSelectedPatientId(newPatient.id);
    setShowAddForm(false);
    
    // Reset inputs
    setNewName('');
    setNewAge(25);
    setNewContact('');
    setNewEmergency('');
    setNewSubstance('');
    setNewRoom('');
  };

  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !selectedPatientId) return;

    const newMed: Medication = {
      id: `med-${Date.now().toString().slice(-6)}`,
      patientId: selectedPatientId,
      medName,
      dosage: medDosage || 'As directed',
      frequency: medFrequency,
      timeOfDay: medTime,
      startDate: medStart,
      status: MedicationStatus.ACTIVE,
      createdAt: new Date().toISOString()
    };

    onAddMedication(selectedPatientId, newMed);
    setMedName('');
    setMedDosage('');
    setShowMedForm(false);
  };

  const handleCreateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progNotes.trim() || !selectedPatientId) return;

    const latestSobriety = patientLogs[0]?.sobrietyDay || 0;

    const newLog: ProgressLog = {
      id: `prog-${Date.now().toString().slice(-6)}`,
      patientId: selectedPatientId,
      date: new Date().toISOString().split('T')[0],
      sobrietyDay: latestSobriety + 1,
      counselorNotes: progNotes,
      heartRate: Number(progHeartRate),
      bloodPressure: progBp,
      temperature: Number(progTemp),
      mood: Number(progMood),
      sleep: Number(progSleep),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddProgressLog(selectedPatientId, newLog);
    setProgNotes('');
    setShowProgressForm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1" id="patients-tab-container">
      
      {/* LEFT COLUMN: Search & Patient List (Col Span 5) */}
      <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]" id="patient-directory-sidebar">
        
        {/* Header toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between" id="patients-sidebar-header">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-lg">Patient Directory</h2>
            <p className="font-sans text-xs text-slate-500">{filteredPatients.length} records found</p>
          </div>
          <button
            id="add-patient-btn"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-medium text-xs rounded-2xl transition duration-150 shadow-sm"
          >
            <Plus size={14} /> Add Patient
          </button>
        </div>

        {/* Search and filter controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3" id="filters-container">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={15} />
            </span>
            <input
              id="search-patient-input"
              type="text"
              placeholder="Search by name, room, id..."
              className="w-full pl-9 pr-4 py-2 text-xs font-sans bg-white border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-slate-400 transition"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-sans">Substance Use</label>
              <select
                id="substance-filter-select"
                className="w-full bg-white border border-slate-200 rounded-xl py-1 px-2 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                value={substanceFilter}
                onChange={e => setSubstanceFilter(e.target.value)}
              >
                {substances.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-sans">Admission Status</label>
              <select
                id="status-filter-select"
                className="w-full bg-white border border-slate-200 rounded-xl py-1 px-2 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value={PatientStatus.ACTIVE}>Active</option>
                <option value={PatientStatus.READMITTED}>Readmitted</option>
                <option value={PatientStatus.DISCHARGED}>Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1" id="patient-scroll-list">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center" id="empty-patients-state">
              <User className="mx-auto text-slate-300 stroke-1" size={32} />
              <p className="mt-2 text-xs font-sans text-slate-500">No matching patient records found.</p>
            </div>
          ) : (
            filteredPatients.map(p => {
              const isActive = selectedPatientId === p.id;
              return (
                <button
                  id={`patient-card-${p.id}`}
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3 rounded-2xl transition duration-150 flex items-center justify-between ${
                    isActive ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-1 pr-2 truncate">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-sans font-semibold text-xs truncate">{p.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        p.status === PatientStatus.ACTIVE ? 'bg-emerald-100 text-emerald-800' :
                        p.status === PatientStatus.READMITTED ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] opacity-75 font-sans">
                      <span>{p.age}y / {p.gender}</span>
                      <span>•</span>
                      <span className="truncate">{p.substance}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[9px] opacity-75 font-mono">{p.room}</span>
                    <span className="block text-[8px] opacity-60 font-sans mt-0.5">ID: {p.id}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Chart of Selected Patient (Col Span 7) */}
      <div className="lg:col-span-7 h-[calc(100vh-12rem)] min-h-[500px]" id="patient-details-panel">
        {selectedPatient ? (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden" id={`chart-frame-${selectedPatient.id}`}>
            
            {/* Patient Header Bio */}
            <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="patient-detail-header">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-sans font-bold text-lg leading-tight">{selectedPatient.name}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      selectedPatient.status === PatientStatus.ACTIVE ? 'bg-emerald-500/20 text-emerald-300' :
                      selectedPatient.status === PatientStatus.READMITTED ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {selectedPatient.status}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-400 mt-0.5">
                    Age {selectedPatient.age} ({selectedPatient.gender}) • Admission: {new Date(selectedPatient.admissionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  id="update-status-select"
                  className="bg-slate-800 border border-slate-700 text-white text-xs font-sans rounded-xl px-2 py-1 focus:outline-none"
                  value={selectedPatient.status}
                  onChange={(e) => onUpdatePatient(selectedPatient.id, { status: e.target.value as PatientStatus })}
                >
                  <option value={PatientStatus.ACTIVE}>Mark Active</option>
                  <option value={PatientStatus.READMITTED}>Mark Readmit</option>
                  <option value={PatientStatus.DISCHARGED}>Mark Discharged</option>
                </select>
                <button 
                  id={`delete-patient-btn-${selectedPatient.id}`}
                  onClick={() => {
                    if (confirm(`Archive ${selectedPatient.name}'s medical chart?`)) {
                      onDeletePatient(selectedPatient.id);
                      setSelectedPatientId(patients.find(p => p.id !== selectedPatient.id)?.id || null);
                    }
                  }}
                  className="p-1 px-2 border border-rose-500/30 text-rose-400 text-xs font-sans hover:bg-rose-500/10 rounded-xl transition"
                >
                  <Trash size={14} className="inline mr-1" /> Archive
                </button>
              </div>
            </div>

            {/* Sub-panels container (scrollable body) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" id="patient-details-scroll-content">
              
              {/* Emergency info and Room occupancy */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="contact-room-gird">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                  <Home className="text-slate-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500 font-sans tracking-tight">Accommodation</span>
                    <span className="block text-slate-800 font-sans text-xs font-semibold mt-1">{selectedPatient.room || "Ward Bed Unassigned"}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                  <Phone className="text-slate-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500 font-sans tracking-tight">Contact</span>
                    <span className="block text-slate-800 font-sans text-xs mt-1">{selectedPatient.contact || "No Contact info"}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-rose-600 font-sans tracking-tight">Emergency Sponsor</span>
                    <span className="block text-slate-800 font-sans text-xs mt-1 leading-snug">{selectedPatient.emergencyContact || "No Emergency Contact Listed"}</span>
                  </div>
                </div>
              </div>

              {/* Grid partition: Left: Meds & Logs, Right: counseling notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="meds-notes-grid">
                
                {/* MEDICATION ROSTER FOR PATIENT */}
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col space-y-3" id="medications-mini-roster">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-sans font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5 leading-none">
                      <Pill size={14} className="text-emerald-600" /> Prescribed Medications
                    </h3>
                    <button
                      id="add-medication-button"
                      onClick={() => setShowMedForm(!showMedForm)}
                      className="text-emerald-600 hover:text-emerald-700 font-sans font-medium text-[11px] flex items-center gap-0.5"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>

                  {showMedForm && (
                    <form onSubmit={handleCreateMedication} className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-3" id="new-medication-form">
                      <div>
                        <input
                          id="new-med-name-input"
                          type="text"
                          required
                          placeholder="Medicine name (e.g., Clonidine)"
                          className="w-full text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                          value={medName}
                          onChange={e => setMedName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          id="new-med-dosage-input"
                          type="text"
                          placeholder="Dosage (e.g. 50mg)"
                          className="text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                          value={medDosage}
                          onChange={e => setMedDosage(e.target.value)}
                        />
                        <select
                          id="new-med-frequency-select"
                          className="text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                          value={medFrequency}
                          onChange={e => setMedFrequency(e.target.value)}
                        >
                          <option>Once Daily</option>
                          <option>Twice Daily</option>
                          <option>Three Times Daily</option>
                          <option>As details direct</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          id="new-med-time-select"
                          className="text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                          value={medTime}
                          onChange={e => setMedTime(e.target.value as MedicationTime)}
                        >
                          <option value={MedicationTime.MORNING}>Morning</option>
                          <option value={MedicationTime.AFTERNOON}>Afternoon</option>
                          <option value={MedicationTime.EVENING}>Evening</option>
                          <option value={MedicationTime.NIGHT}>Night</option>
                        </select>
                        <input
                          id="new-med-start-input"
                          type="date"
                          className="text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                          value={medStart}
                          onChange={e => setMedStart(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          id="cancel-med-form-btn"
                          type="button"
                          onClick={() => setShowMedForm(false)}
                          className="px-2 py-1 text-[10px] font-sans text-slate-500 rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          id="save-med-form-btn"
                          type="submit"
                          className="px-2 py-1 text-[10px] font-sans bg-slate-950 text-white rounded-lg hover:bg-slate-800"
                        >
                          Prescribe
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-[250px] overflow-y-auto" id="medications-list">
                    {patientMeds.length === 0 ? (
                      <p className="font-sans text-slate-500 text-xs italic py-2">No medications currently prescribed.</p>
                    ) : (
                      patientMeds.map(m => (
                        <div key={m.id} className="bg-white border border-slate-100 p-3 rounded-xl flex items-start justify-between" id={`med-card-${m.id}`}>
                          <div className="space-y-1">
                            <p className="font-sans font-bold text-xs text-slate-800">{m.medName}</p>
                            <p className="font-sans text-[10px] text-slate-500">{m.dosage} • {m.frequency}</p>
                            <span className="inline-block text-[9px] font-sans px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded capitalize mt-1">
                              Time: {m.timeOfDay}
                            </span>
                          </div>
                          <span className="text-[9px] font-sans text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded capitalize">
                            {m.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* CLINICAL PROGRESS NOTES FEED */}
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col space-y-3" id="progress-logs-mini-roster">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-sans font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5 leading-none">
                      <FileText size={14} className="text-indigo-600" /> Counselor Session Notes
                    </h3>
                    <button
                      id="add-progress-button"
                      onClick={() => setShowProgressForm(!showProgressForm)}
                      className="text-indigo-600 hover:text-indigo-700 font-sans font-medium text-[11px] flex items-center gap-0.5"
                    >
                      <Plus size={12} /> Add Note
                    </button>
                  </div>

                  {showProgressForm && (
                    <form onSubmit={handleCreateProgress} className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-3" id="new-progress-log-form">
                      <div>
                        <textarea
                          id="new-prog-notes-textarea"
                          required
                          rows={3}
                          placeholder="Counselor sessions recap, assessment, behavioral observations..."
                          className="w-full text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                          value={progNotes}
                          onChange={e => setProgNotes(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 block font-sans">Heart Rate</label>
                          <input
                            id="new-prog-hr-input"
                            type="number"
                            className="w-full text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                            value={progHeartRate}
                            onChange={e => setProgHeartRate(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 block font-sans">BP (e.g. 120/80)</label>
                          <input
                            id="new-prog-bp-input"
                            type="text"
                            className="w-full text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                            value={progBp}
                            onChange={e => setProgBp(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 block font-sans">Temp (°F)</label>
                          <input
                            id="new-prog-temp-input"
                            type="number"
                            step="0.1"
                            className="w-full text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                            value={progTemp}
                            onChange={e => setProgTemp(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 block font-sans">Mood Rating (1-10)</label>
                          <input
                            id="new-prog-mood-input"
                            type="range"
                            min="1"
                            max="10"
                            className="w-full"
                            value={progMood}
                            onChange={e => setProgMood(Number(e.target.value))}
                          />
                          <span className="text-[9px] font-sans font-bold float-right text-slate-700">{progMood}/10</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 block font-sans">Sleep (hours)</label>
                          <input
                            id="new-prog-sleep-input"
                            type="number"
                            step="0.5"
                            className="w-full text-xs font-sans py-1.5 px-2 border border-slate-200 rounded-lg text-slate-800"
                            value={progSleep}
                            onChange={e => setProgSleep(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          id="cancel-progress-form-btn"
                          type="button"
                          onClick={() => setShowProgressForm(false)}
                          className="px-2 py-1 text-[10px] font-sans text-slate-500 rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          id="save-progress-form-btn"
                          type="submit"
                          className="px-2 py-1 text-[10px] font-sans bg-slate-950 text-white rounded-lg hover:bg-slate-800"
                        >
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto" id="progress-notes-list">
                    {patientLogs.length === 0 ? (
                      <p className="font-sans text-slate-500 text-xs italic py-2">No counseling journal notes recorded.</p>
                    ) : (
                      patientLogs.map(l => (
                        <div key={l.id} className="bg-white border border-slate-100 p-3.5 rounded-xl space-y-2" id={`prog-note-card-${l.id}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-sans font-bold text-slate-500 uppercase tracking-tight">Sobriety Day {l.sobrietyDay}</span>
                            <span className="text-[9px] font-sans text-slate-400 font-mono flex items-center gap-1">
                              <Calendar size={10} /> {new Date(l.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-sans text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">{l.counselorNotes}</p>
                          
                          {/* Vitals indicators */}
                          <div className="flex gap-2.5 pt-1.5 border-t border-slate-50 text-[9px] text-slate-500 font-sans" id={`note-vitals-${l.id}`}>
                            {l.heartRate && (
                              <span className="bg-slate-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                                <Heart size={8} className="text-rose-500" /> HR: {l.heartRate} bpm
                              </span>
                            )}
                            {l.bloodPressure && (
                              <span className="bg-slate-50 px-1 py-0.5 rounded">BP: {l.bloodPressure}</span>
                            )}
                            {l.mood && (
                              <span className="bg-amber-50 text-amber-900 px-1 py-0.5 rounded flex items-center gap-0.5">
                                <Award size={8} /> Mood: {l.mood}/10
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm h-full flex items-center justify-center p-8 text-center" id="no-patient-selected-placeholder">
            <div className="max-w-md space-y-3">
              <User className="text-slate-200 mx-auto stroke-1" size={64} />
              <h3 className="font-sans font-bold text-slate-700 text-base">No Patient Selected</h3>
              <p className="font-sans text-xs text-slate-500">Select a patient records card on the directory file list to view full clinical details, record counselor diagnostics notes, configure medications, or transition status settings.</p>
            </div>
          </div>
        )}
      </div>

      {/* POPUP: ADD PATIENT SLIDER MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="add-patient-modal">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col justify-between" id="add-patient-modal-content">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center" id="add-patient-modal-header">
              <div>
                <h3 className="font-sans font-bold text-base">New Intake Registration</h3>
                <p className="font-sans text-xs text-slate-400 mt-0.5">Admission Records & Clinical Diagnosis File</p>
              </div>
              <button 
                id="close-add-modal-btn"
                onClick={() => setShowAddForm(false)} 
                className="text-slate-400 hover:text-white transition text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 max-h-[450px] overflow-y-auto" id="add-patient-form">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Full Patient Name *</label>
                <input
                  id="form-patient-name"
                  type="text"
                  required
                  placeholder="e.g., Bilal Ahmed Khan"
                  className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Age *</label>
                  <input
                    id="form-patient-age"
                    type="number"
                    required
                    min="12"
                    max="100"
                    className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    value={newAge}
                    onChange={e => setNewAge(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Gender *</label>
                  <select
                    id="form-patient-gender"
                    className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    value={newGender}
                    onChange={e => setNewGender(e.target.value)}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Sponsor Contact (Phone)</label>
                  <input
                    id="form-patient-contact"
                    type="text"
                    placeholder="e.g., +92 300 0000000"
                    className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Allocation Room / Bed</label>
                  <input
                    id="form-patient-room"
                    type="text"
                    placeholder="e.g. Ward C - Bed 5"
                    className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    value={newRoom}
                    onChange={e => setNewRoom(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Primary Substance Condition *</label>
                <input
                  id="form-patient-substance"
                  type="text"
                  required
                  placeholder="e.g., Methamphetamine (Ice), Alcohol, Heroin"
                  className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  value={newSubstance}
                  onChange={e => setNewSubstance(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 font-sans uppercase">Emergency Guardian & Phone Details *</label>
                <textarea
                  id="form-patient-emergency"
                  required
                  rows={2}
                  placeholder="e.g. Tariq Mehmood (Brother) - +92 321 000000"
                  className="w-full text-xs font-sans py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  value={newEmergency}
                  onChange={e => setNewEmergency(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3" id="add-patient-modal-footer">
                <button
                  id="cancel-add-patient-btn"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 font-sans font-medium text-xs text-slate-500 rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  id="save-add-patient-btn"
                  type="submit"
                  className="px-5 py-2 font-sans font-medium text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm"
                >
                  Admit Registrant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
