import { useState } from 'react';
import { 
  Award, Heart, Clock, Calendar, ShieldCheck, Thermometer, Brain, 
  Activity, ArrowRight, User
} from 'lucide-react';
import { Patient, ProgressLog } from '../types';

interface ProgressTabProps {
  patients: Patient[];
  progressLogs: ProgressLog[];
}

export default function ProgressTab({
  patients,
  progressLogs
}: ProgressTabProps) {
  const activePatients = patients.filter(p => p.status !== 'discharged');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(activePatients[0]?.id || null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  
  // Sorted records of progress
  const patientLogs = progressLogs
    .filter(l => l.patientId === selectedPatientId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Generate beautiful custom SVG Line Points for Mood progress (1 to 10 scale)
  const getSvgCoordinates = (logs: ProgressLog[], width: number, height: number): string => {
    if (logs.length < 2) return '';
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    return logs.map((log, index) => {
      const x = padding + (index / (logs.length - 1)) * chartWidth;
      // Mood is 1 to 10. Map 10 to top (padding), 1 to bottom (padding + chartHeight)
      const moodValue = log.mood || 5;
      const y = padding + chartHeight - ((moodValue - 1) / 9) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  // Highest sobriety milestone calculations
  const topSobrietyPatients = [...patients]
    .map(p => {
      const logs = progressLogs.filter(l => l.patientId === p.id);
      const mDay = logs.length > 0 ? Math.max(...logs.map(l => l.sobrietyDay)) : 0;
      return { p, mDay };
    })
    .sort((a, b) => b.mDay - a.mDay)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1" id="progress-tracking-system">
      
      {/* LEFT COLUMN: ACTIVE CLIENTS INDEX & MILESTONES (Col Span 4) */}
      <div className="lg:col-span-4 space-y-5" id="progress-left-sidebar">
        
        {/* Sobriety Streaks Milestones Board */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800" id="sobriety-leaderboard-card">
          <h3 className="font-sans font-bold text-sm tracking-tight flex items-center gap-1.5 mb-4">
            <Award className="text-amber-400" size={16} /> Sobriety Milestone Board
          </h3>
          <div className="space-y-3" id="milestones-rank-list">
            {topSobrietyPatients.map((entry, index) => (
              <div key={entry.p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 border border-slate-700/60" id={`rank-badge-${index}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    index === 0 ? 'bg-amber-400 text-slate-950' : 
                    index === 1 ? 'bg-slate-300 text-slate-800' : 
                    'bg-slate-600 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="truncate text-xs">
                    <p className="font-sans font-semibold text-white truncate">{entry.p.name}</p>
                    <p className="text-[10px] text-slate-400 italic shrink-0 truncate">{entry.p.substance}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-sans font-bold text-emerald-400 text-sm">{entry.mDay} Days</span>
                  <span className="block text-[8px] text-slate-400 uppercase font-sans">Sober Streak</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Roster list for chart plotting */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col max-h-[450px]" id="plotting-patient-selector">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider block">Clinical Active Roster</h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Select patient chart to plot timeline curves</p>
          </div>

          <div className="overflow-y-auto pt-3 space-y-1.5 flex-1" id="plotting-patients-list">
            {activePatients.map(p => {
              const isActive = selectedPatientId === p.id;
              const pLogs = progressLogs.filter(l => l.patientId === p.id);
              const totalDays = pLogs.length > 0 ? Math.max(...pLogs.map(l => l.sobrietyDay)) : 0;
              return (
                <button
                  id={`plot-card-${p.id}`}
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition ${
                    isActive ? 'bg-indigo-50 text-indigo-950 border border-indigo-200 shadow-xs' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="truncate text-left shrink pr-2">
                    <span className="block font-sans font-bold text-xs text-slate-800 truncate">{p.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono truncate">{p.room}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      {totalDays}d
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: RECOVERY CURVES & PROGRESS TIMELINE LOGS (Col Span 8) */}
      <div className="lg:col-span-8 space-y-6" id="progress-timeline-curves">
        {selectedPatient ? (
          <div className="space-y-6" id={`patient-timeline-canvas-${selectedPatient.id}`}>
            
            {/* SVG STABILITY METRICS CHARTS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="recovery-curves-card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Patient Mood & Psychological Stability Curve</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Plotting self-reported counseling indices over {patientLogs.length} logged sessions</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-sans">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="inline-block w-3 h-3 bg-indigo-500 rounded-full"></span> Mood (1-10)
                  </span>
                </div>
              </div>

              {patientLogs.length < 2 ? (
                <div className="h-44 flex items-center justify-center border border-dashed rounded-2xl bg-slate-50 text-slate-500 text-xs font-sans" id="insufficient-data-panel">
                  Insufficient session history log lines to plot curved graph. Need at least 2 counselor journals.
                </div>
              ) : (
                <div className="space-y-4" id="graph-panel">
                  
                  {/* Actual SVG line graphing */}
                  <div className="relative h-48 bg-slate-50 border border-slate-100 rounded-2xl p-2" id="svg-plotting-canvas">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                      {/* Grid Lines */}
                      <line x1="0" y1="15" x2="500" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="85" x2="500" y2="85" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Timeline points string calculation */}
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={getSvgCoordinates(patientLogs, 500, 150)}
                      />

                      {/* Glowing Gradient fill below path */}
                      <path
                        d={`M 20,130 L ${getSvgCoordinates(patientLogs, 500, 150)} L 480,130 Z`}
                        fill="url(#indigo-glow)"
                        opacity="0.12"
                      />

                      <defs>
                        <linearGradient id="indigo-glow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Points markup */}
                      {patientLogs.map((log, index) => {
                        const padding = 20;
                        const x = padding + (index / (patientLogs.length - 1)) * (500 - padding * 2);
                        const moodValue = log.mood || 5;
                        const y = padding + (150 - padding * 2) - ((moodValue - 1) / 9) * (150 - padding * 2);
                        return (
                          <g key={log.id} className="group cursor-pointer">
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#4f46e5"
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="transition hover:r-7 duration-150"
                            />
                            {/* Simple inline tooltip fallback */}
                            <text
                              x={x}
                              y={y - 12}
                              textAnchor="middle"
                              className="text-[9px] font-sans font-extrabold fill-indigo-950 font-mono hidden group-hover:block"
                            >
                              Day{log.sobrietyDay}: {moodValue}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[9px] text-slate-400 font-sans">
                      <span>Start: {new Date(patientLogs[0].date).toLocaleDateString()}</span>
                      <span>Timeline (Session Check-ins)</span>
                      <span>Latest: {new Date(patientLogs[patientLogs.length - 1].date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1" id="stability-numerical-metrics">
                    <div className="p-3 bg-slate-55 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Initial Mood</span>
                      <span className="block text-slate-800 font-sans font-bold text-base mt-0.5">{patientLogs[0].mood}/10</span>
                    </div>
                    <div className="p-3 bg-slate-55 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Current Mood</span>
                      <span className="block text-indigo-650 font-sans font-bold text-base mt-0.5">{patientLogs[patientLogs.length - 1].mood}/10</span>
                    </div>
                    <div className="p-3 bg-slate-55 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Average Sleep</span>
                      <span className="block text-slate-800 font-sans font-bold text-base mt-0.5">
                        {(patientLogs.reduce((acc, l) => acc + l.sleep, 0) / patientLogs.length).toFixed(1)} hrs
                      </span>
                    </div>
                    <div className="p-3 bg-slate-55 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Vital Integrity</span>
                      <span className="block text-emerald-600 font-sans font-bold text-xs mt-1.5 flex items-center gap-0.5 justify-center">
                        <ShieldCheck size={12} /> CLINICALLY OK
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DETAILED DAILY JOURNAL LOG SHEETS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4" id="counselor-journal-logs">
              <h3 className="font-sans font-bold text-slate-800 text-sm">Logged Sessions Timeline and Counselors Archives</h3>
              
              <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6" id="notes-timeline-feed">
                {patientLogs.map(log => (
                  <div key={log.id} className="relative group" id={`timeline-card-${log.id}`}>
                    {/* Circle icon marker on line */}
                    <span className="absolute -left-[32px] top-1 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white group-hover:bg-indigo-600 transition duration-150"></span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-black text-xs text-slate-800">Sobriety Check-In: Day {log.sobrietyDay}</span>
                        <span className="text-[10px] text-slate-400 font-mono">• {new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-sans text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100/50 p-4 rounded-2xl whitespace-pre-wrap">{log.counselorNotes}</p>
                      
                      <div className="flex gap-4 text-[9px] text-slate-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Brain size={12} className="text-purple-500" /> Psychology Level: {log.mood}/10
                        </span>
                        {log.heartRate && (
                          <span className="flex items-center gap-1">
                            <Activity size={12} className="text-rose-500" /> Vitals Pulse: {log.heartRate} bpm
                          </span>
                        )}
                        {log.temperature && (
                          <span className="flex items-center gap-1">
                            <Thermometer size={12} className="text-slate-400" /> Temp: {log.temperature}°F
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm h-72 flex items-center justify-center p-8 text-center" id="no-patient-plotting-placeholder">
            <div className="max-w-md space-y-3">
              <User className="text-slate-200 mx-auto" size={48} />
              <p className="font-sans text-xs text-slate-500">Select an active rehabilitation patient from the clinic list to render psychological stability curves and view their counselor session journal files.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
