import { useState } from 'react';
import { 
  Smartphone, Award, Brain, Phone, ShieldCheck, HeartPulse, Sparkles,
  Inbox, ChevronLeft, Calendar, HelpCircle, Activity, Wind, Lock, Unlock, ShieldAlert, Languages
} from 'lucide-react';
import { Patient, Medication, ProgressLog, PatientStatus } from '../types';

interface CompanionSimulatorProps {
  patients: Patient[];
  medications: Medication[];
  progressLogs: ProgressLog[];
  onAddProgressLog: (patientId: string, log: ProgressLog) => void;
  onUpdatePatient?: (id: string, updates: Partial<Patient>) => void;
}

// English and Urdu translations for the outpatient companion interface
const t = {
  en: {
    appTitle: "Shaaf Aftercare App",
    greeting: "Hi, ",
    outpatientSobriety: "Outpatient Sobriety",
    daysSober: "Days Sober",
    dailyWellnessLog: "Daily Wellness Log",
    moodAssessment: "Mood assessment",
    sleepHours: "Hours slept last night",
    submitCheckIn: "Submit Check-In",
    synced: "✓ Logs Synced with Clinicians",
    aftercareMedPlan: "Aftercare Medical Plan",
    noPostMeds: "No post-discharge medicines scheduled.",
    daily: "DAILY",
    dose: "Dose",
    copingHeader: "Coping Strategies",
    copingSub: "Aftercare Support System",
    breathingTitle: "Anti-Stress Deep Breathing",
    breathingSub: "Breathe in response to the slow bubble pulse",
    inhaleExhale: "Inhale ... Exhale",
    delayTactic: "Mindful delay tactic",
    delayDesc: "Remind yourself to delay immediate urge by exactly 15 minutes. Cravings drop in waves.",
    cbtDefense: "CBT trigger defense",
    cbtDesc: "Avoid environments list designed by Counselor Yasir during key counseling sessions.",
    navHome: "Home",
    navCoping: "Coping",
    navSos: "SOS Help",
    callingRehab: "Calling Shaaf Rehab",
    connectingAftercare: "Connecting Direct Aftercare support... A clinical officer is ready to answer your call immediately.",
    cancelSos: "Cancel SOS Alarm",
    inpatientWard: "Inpatient Ward Active stay",
    inpatientLocked: "Smartphone Locked during residency",
    inpatientDesc: "Under strict policy, active patients do not hold active phone status inside the facility to lock behavioral boundaries.",
    overrideTitle: "Clinician Mock Tool",
    overrideDesc: "Simulate outpatient graduation to test aftercare companion app interfaces:",
    overrideBtn: "Graduate & Hand-off App",
  },
  ur: {
    appTitle: "شاف آفٹر کیئر ایپ",
    greeting: "سلام، ",
    outpatientSobriety: "صحت یابی کی مستقلی",
    daysSober: "روزہائے صحت مندی",
    dailyWellnessLog: "روزانہ تندرستی کا اندراج",
    moodAssessment: "مزاج کی حالت کا جائزہ",
    sleepHours: "کل رات سونے کے گھنٹے",
    submitCheckIn: "اندراج جمع کریں",
    synced: "✓ معلومات کونسلر کو بھیج دی گئی",
    aftercareMedPlan: "آفٹر کیئر طبی منصوبہ",
    noPostMeds: "کوئی دوا مقرر نہیں ہے۔",
    daily: "روزانہ",
    dose: "خوراک",
    copingHeader: "رہنمائی اور طریقہ کار",
    copingSub: "آفٹر کیئر امدادی نظام",
    breathingTitle: "ذہنی دباؤ کم کرنے والی گہری سانس",
    breathingSub: "بلبلے کے سائز کے مطابق پُرسکون سانس لیں",
    inhaleExhale: "سانس لیں ... سانس چھوڑیں",
    delayTactic: "خواہش کو ٹالنے کا طریقہ",
    delayDesc: "خواہش اٹھنے پر ٹھیک 15 منٹ انتظار کریں۔ وقت کے ساتھ طلب کی شدت کم ہو جاتی ہے۔",
    cbtDefense: "اہم ٹرگر سے پرہیز",
    cbtDesc: "کونسلر یاسر کے بتائے ہوئے خطرناک ماحول اور صحبت سے دور رہیں۔",
    navHome: "ہوم",
    navCoping: "قابو پانا",
    navSos: "امداد",
    callingRehab: "شاف ریہیب کو کال جا رہی ہے...",
    connectingAftercare: "برائے راست آفٹر کیئر مدد سے رابطہ قائم ہو رہا ہے... ایک طبی افسر فوری جواب دینے کے لیے تیار ہے۔",
    cancelSos: "الارم منسوخ کریں",
    inpatientWard: "داخل مریض وارڈ",
    inpatientLocked: "دورانِ علاج فون لاک ہے",
    inpatientDesc: "سخت قواعد کے تحت، مریض کو سیشنز اور علاج پر توجہ دینے کے لیے داخلے کے دوران فون استعمال کرنے کی اجازت نہیں ہوتی۔",
    overrideTitle: "طبی معالج کا آزمائشی بٹن",
    overrideDesc: "ڈسچارج کے بعد کے مریض کے موبائل فیچرز آزمائیں:",
    overrideBtn: "مریض کو صحت یاب کر کے ایپ دیں",
  }
};

export default function CompanionSimulator({
  patients,
  medications,
  progressLogs,
  onAddProgressLog,
  onUpdatePatient
}: CompanionSimulatorProps) {
  // Sort patients so Discharged Outpatients are listed together
  const initialPatientId = patients.find(p => p.status === PatientStatus.DISCHARGED)?.id || patients[0]?.id || '';
  const [activePatientId, setActivePatientId] = useState<string>(initialPatientId);
  const [simulatedMood, setSimulatedMood] = useState<number>(7);
  const [simulatedSleep, setSimulatedSleep] = useState<number>(7.5);
  const [checkInDone, setCheckInDone] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  
  // Mobile navigation tabs inside unlocked app
  const [mobileTab, setMobileTab] = useState<'home' | 'coping'>('home');

  const patient = patients.find(p => p.id === activePatientId);
  const patientLogs = progressLogs.filter(l => l.patientId === activePatientId);
  const totalDays = patientLogs.length > 0 ? Math.max(...patientLogs.map(l => l.sobrietyDay)) : 5;

  const patientMeds = medications.filter(m => m.patientId === activePatientId && m.status === 'active');

  const quotesEn = [
    "One day at a time. Your recovery is a journey, not a destination.",
    "The first step towards getting somewhere is to decide you're not going to stay where you are.",
    "You are stronger than your triggers. Every urge has a beginning, a middle, and an end.",
    "Be gentle with yourself. You are doing the best you can, and you are worthy of healing.",
    "Healing is not linear, but every sober heartbeat is a victory."
  ];

  const quotesUr = [
    "ایک وقت میں ایک ہی دن۔ آپ کی صحت یابی ایک سفر ہے، منزل نہیں ہے۔",
    "آگے بڑھنے کا پہلا قدم یہ فیصلہ کرنا ہے کہ آپ جہاں ہیں اب وہاں نہیں رہیں گے۔",
    "آپ اپنے ٹرگرز سے زیادہ مضبوط ہیں۔ ہر طلب کی ایک شروعات اور ایک انجام ہوتا ہے۔",
    "اپنے اوپر نرمی برتیں۔ آپ اپنی بہترین کوشش کر رہے ہیں اور مکمل تندرستی کے حقدار ہیں۔",
    "صحت یابی کا سفر سیدھا نہیں ہوتا، لیکن ہر دن ایک نئی کامیابی ہے۔"
  ];

  const quotes = language === 'ur' ? quotesUr : quotesEn;
  const currentQuote = quotes[Math.floor((patient?.name.length || 0) % quotes.length)];

  const handlePatientSelfCheckIn = () => {
    if (!patient) return;
    
    // Create self check-in progress log for outpatient
    const selfLog: ProgressLog = {
      id: `prog-self-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      sobrietyDay: totalDays + 1,
      counselorNotes: `[Outpatient Self Check-In App - Preferred Language: ${language.toUpperCase()}] Participant submitted mood rating: ${simulatedMood}/10. Reported sleeping ${simulatedSleep} hours. Logged via outpatient aftercare device.`,
      mood: simulatedMood,
      sleep: simulatedSleep,
      heartRate: 72,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddProgressLog(patient.id, selfLog);
    setCheckInDone(true);
    setTimeout(() => setCheckInDone(false), 3000);
  };

  const handleSimulateDischarge = () => {
    if (!patient || !onUpdatePatient) return;
    onUpdatePatient(patient.id, { status: PatientStatus.DISCHARGED });
  };

  const isDischarged = patient?.status === PatientStatus.DISCHARGED;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full p-1" id="android-companion-simulator">
      
      {/* SIMULATORY EXPLAINER SIDEBAR */}
      <div className="lg:col-span-5 space-y-6" id="simulator-description-panel">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="font-sans font-black text-slate-800 text-sm">Outpatient Aftercare Device Portal</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Physical device & recovery companion app</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-2.5">
            <h4 className="font-sans font-bold text-amber-800 text-xs flex items-center gap-1.5 leading-none">
              <Lock size={13} /> Strict Inpatient Lock Policy
            </h4>
            <p className="font-sans text-[11px] text-slate-605 leading-relaxed">
              To guarantee full clinical focus during detox and behavioral therapies, residents at <strong>Shaaf Rehabilitation Center</strong> are strictly prohibited from utilizing personal smartphones inside active treatment areas.
            </p>
          </div>

          <div className="space-y-3.5">
            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              Upon program completion and discharge, clinicians supply patients with their <strong>Aftercare Companion App</strong>. This simulates their real personal smartphone interface, allowing them to track sobriety streaks from the second they leave the wards.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                <Languages size={15} className="text-indigo-500 shrink-0" /> 
                <span>Choose Language <span className="text-[10px] text-slate-400 font-normal">/ زبان کا انتخاب</span></span>
              </span>
              <div className="flex bg-white border rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-md ${
                    language === 'en' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ur')}
                  className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-md ${
                    language === 'ur' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  اردو (Urdu)
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Active Subject Selector</label>
            <select
              id="simulator-patient-select"
              className="w-full text-xs font-sans py-2.5 px-3 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              value={activePatientId}
              onChange={e => setActivePatientId(e.target.value)}
            >
              <optgroup label="Discharged (Aftercare Companion Unlocked)">
                {patients.filter(p => p.status === PatientStatus.DISCHARGED).map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Outpatient)</option>
                ))}
              </optgroup>
              <optgroup label="Active Inpatients (Device Restricted)">
                {patients.filter(p => p.status !== PatientStatus.DISCHARGED).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.status.toUpperCase()})</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* SOS Hotline Alert Explainer */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl space-y-3" id="sos-helpline-box">
          <h4 className="font-sans font-bold text-emerald-800 text-xs uppercase flex items-center gap-1.5 leading-none">
            <Phone size={14} className="text-emerald-600" /> Crisis SOS Dispatch Hub
          </h4>
          <p className="font-sans text-[11px] text-emerald-700 leading-relaxed">
            The red SOS button inside the post-treatment app alerts center clinicians and connects the patient in real time with a dedicated counselor line (e.g. Staff Nurse Yasir) if relapse urges strike.
          </p>
        </div>
      </div>

      {/* MOBILE DEVICE SIMULATOR IN CENTRAL LAYOUT */}
      <div className="lg:col-span-7 flex justify-center" id="android-device-wrapper">
        <div className="relative w-[310px] h-[610px] bg-slate-950 rounded-[48px] p-3 text-white border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden" id="phone-frame">
          
          {/* Hardware ear bar notch */}
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 h-5 w-28 bg-slate-950 rounded-b-2xl z-25 flex items-center justify-center" id="notch">
            <span className="h-1 w-8 bg-slate-800 rounded-full block"></span>
            <span className="h-2 w-2 bg-slate-900 border border-slate-800 rounded-full block ml-2"></span>
          </div>

          {/* SIMULATED IN-PHONE INTERACTIVE CONTENT SCREEN */}
          <div className="flex-1 bg-slate-900 rounded-[38px] flex flex-col justify-between overflow-hidden relative" id="phone-screen">
            
            {/* Top status bar inside screen */}
            <div className="h-10 pt-5 px-6 flex justify-between items-center text-[10px] text-slate-400 font-mono z-20" id="phone-top-status-bar">
              <span>08:00 AM</span>
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="h-2.5 w-4 bg-slate-650 rounded-xs inline-block relative border border-slate-600">
                  <span className="h-1 w-0.5 bg-slate-400 absolute -right-1 top-0.5"></span>
                </span>
              </div>
            </div>

            {/* SCREEN SCROLLABLE AREA */}
            <div className="flex-1 overflow-y-auto px-5 pt-3" id="phone-content-view" dir={language === 'ur' ? 'rtl' : 'ltr'}>
              {patient ? (
                <div>
                  
                  {/* HELPLINE ACTIVE SOS POPUP OVERLAY */}
                  {sosActive && (
                    <div className="absolute inset-0 bg-rose-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-40" id="sos-calling-overlay">
                      <HeartPulse className="text-rose-500 animate-pulse" size={56} />
                      <h4 className="font-sans font-bold text-lg mt-4 text-white">{t[language].callingRehab}</h4>
                      <p className="font-sans text-xs text-rose-300 mt-2 leading-relaxed">{t[language].connectingAftercare}</p>
                      
                      <button
                        id="cancel-sos-device-btn"
                        onClick={() => setSosActive(false)}
                        className="mt-8 px-6 py-2.5 bg-white text-rose-950 font-sans font-bold text-xs rounded-full shadow-lg"
                      >
                        {t[language].cancelSos}
                      </button>
                    </div>
                  )}

                  {/* DIFFERENTIAL VIEW: ENFORCE INPATIENT SMARTPHONE LOCK SCREEN */}
                  {!isDischarged ? (
                    <div className="h-full flex flex-col justify-center items-center text-center py-10 px-2 space-y-6" id="device-militarized-lock">
                      <div className="h-16 w-16 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
                        <Lock size={32} />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold text-amber-500 font-sans tracking-widest block">{t[language].inpatientWard}</span>
                        <h4 className="font-sans font-extrabold text-[#f1f5f9] text-sm">{t[language].inpatientLocked}</h4>
                        <p className="font-sans text-[10px] text-slate-400 leading-relaxed">
                          {t[language].inpatientDesc.replace('{name}', patient.name.split(' ')[0])}
                        </p>
                      </div>

                      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full text-left space-y-3" id="clinician-override-widget" dir="ltr">
                        <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider font-sans">Clinician Mock Tool</span>
                        <p className="text-[10px] text-slate-300 font-sans leading-snug">Simulate outpatient graduation to test aftercare companion app interfaces:</p>
                        
                        <button
                          id="simulate-discharge-lockscreen-btn"
                          onClick={handleSimulateDischarge}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-[10px] rounded-xl transition duration-150 flex items-center justify-center gap-1.5"
                        >
                          <Unlock size={11} /> Graduate & Hand-off App
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* SCREEN TRANSITION ROUTES FOR DISCHARGED AFTERCARE PATIENTS */
                    <div>
                      {mobileTab === 'home' && (
                        <div className="space-y-4 animate-fade-in" id="phone-home-view">
                          
                          {/* Recovery header block */}
                          <div className="flex justify-between items-start" id="companion-user-header">
                            <div className={language === 'ur' ? 'text-right' : 'text-left'}>
                              <span className="text-[9px] text-[#22c55e] font-sans font-bold uppercase tracking-wider block">{t[language].appTitle}</span>
                              <h4 className="font-sans font-bold text-sm tracking-tight text-[#f1f5f9] mt-0.5">
                                {t[language].greeting}{patient.name.split(' ')[0]}
                              </h4>
                            </div>
                            <Sparkles size={16} className="text-yellow-400 shrink-0" />
                          </div>

                          {/* Sobriety radial circle graphic */}
                          <div className="p-4 bg-slate-800 border border-slate-700/50 rounded-2xl flex items-center justify-between" id="device-sobriety-badge">
                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400 font-sans">{t[language].outpatientSobriety}</span>
                              <p className="font-sans font-black text-lg text-emerald-400">{totalDays} {t[language].daysSober}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full border-2 border-emerald-500/30 border-t-[#22c55e] flex items-center justify-center text-[10px] font-bold font-mono">
                              {totalDays}{language === 'ur' ? 'دن' : 'd'}
                            </div>
                          </div>

                          {/* Everyday supportive quote block */}
                          <div className="p-3.5 bg-slate-800/40 rounded-xl italic text-[10px] text-slate-300 border-l-2 border-emerald-500 font-sans leading-relaxed" id="device-quote-card">
                            "{currentQuote}"
                          </div>

                          {/* DAILY DOSE NOTIFICATION CARD */}
                          <div className="space-y-1.5" id="device-meds-notifications">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans block">{t[language].aftercareMedPlan}</span>
                            {patientMeds.length === 0 ? (
                              <div className="p-3 bg-slate-800/50 rounded-xl text-[9px] text-slate-400 italic">{t[language].noPostMeds}</div>
                            ) : (
                              patientMeds.slice(0, 1).map(m => (
                                <div key={m.id} className="p-3 bg-slate-800 border border-slate-700/30 rounded-xl flex items-center justify-between" id={`device-med-${m.id}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 px-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-bold uppercase tracking-wider font-sans">{t[language].daily}</span>
                                    <div className="text-[10px]">
                                      <p className="font-sans font-bold text-slate-200">{m.medName}</p>
                                      <span className="text-slate-400 text-[9px] block">{t[language].dose}: {m.dosage} ({m.timeOfDay})</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* MOBILE PATIENT SELF-REPORT CHECKIN SLIDERS */}
                          <div className="bg-slate-800 p-4 rounded-2xl space-y-3 border border-slate-700/50" id="device-check-in-pane">
                            <h4 className="font-sans font-bold text-xs text-slate-200">{t[language].dailyWellnessLog}</h4>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-slate-400 font-sans">
                                <span>{t[language].moodAssessment}</span>
                                <span className="font-bold text-emerald-400" dir="ltr">{simulatedMood}/10</span>
                              </div>
                              <input
                                id="device-mood-slider"
                                type="range"
                                min="1"
                                max="10"
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                value={simulatedMood}
                                onChange={e => setSimulatedMood(Number(e.target.value))}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-slate-400 font-sans">
                                <span>{t[language].sleepHours}</span>
                                <span className="font-bold text-indigo-400" dir="ltr">{simulatedSleep} hrs</span>
                              </div>
                              <input
                                id="device-sleep-slider"
                                type="range"
                                min="4"
                                max="12"
                                step="0.5"
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                value={simulatedSleep}
                                onChange={e => setSimulatedSleep(Number(e.target.value))}
                              />
                            </div>

                            <button
                              id="submit-device-check-in-btn"
                              onClick={handlePatientSelfCheckIn}
                              disabled={checkInDone}
                              className={`w-full py-2 font-sans font-black text-xs rounded-xl transition shadow-xs ${
                                checkInDone ? 'bg-emerald-600 text-white' : 'bg-[#22c55e] text-slate-950 hover:bg-[#16a34a]'
                              }`}
                            >
                              {checkInDone ? t[language].synced : t[language].submitCheckIn}
                            </button>
                          </div>

                        </div>
                      )}

                      {mobileTab === 'coping' && (
                        <div className="space-y-4 animate-fade-in" id="phone-coping-view">
                          <div className="space-y-1">
                            <span className="text-[10px] text-emerald-400 font-sans uppercase block">{t[language].copingSub}</span>
                            <h4 className="font-sans font-bold text-sm text-[#f1f5f9]">{t[language].copingHeader}</h4>
                          </div>

                          {/* INTERACTIVE PULSE BREATHING CIRCLE */}
                          <div className="bg-slate-800 p-4 rounded-2xl text-center space-y-3.5 border border-slate-700/50" id="device-breathing-exercise">
                            <div className="space-y-0.5">
                              <h5 className="font-sans font-bold text-xs text-slate-200">{t[language].breathingTitle}</h5>
                              <p className="text-[9px] text-slate-400 font-sans">{t[language].breathingSub}</p>
                            </div>

                            <div className="h-24 w-24 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-400/20 relative" id="breathing-circle">
                              <Wind className="text-indigo-400 animate-pulse" size={24} />
                              <span className="absolute inset-0 rounded-full bg-indigo-500/5 animate-ping"></span>
                            </div>

                            <span className="text-[9px] font-sans text-indigo-300 font-bold block">{t[language].inhaleExhale}</span>
                          </div>

                          {/* Cognitive relapse prevention guidelines */}
                          <div className="space-y-2 text-right" id="relapse-coping-list">
                            <div className="p-3 bg-slate-800 rounded-xl flex items-start gap-2.5">
                              <span className="h-4 w-4 shrink-0 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold font-mono text-[9px]">1</span>
                              <div className="text-[9px] font-sans text-right flex-1">
                                <h5 className="font-bold text-slate-200 leading-none">{t[language].delayTactic}</h5>
                                <p className="text-slate-400 mt-1 leading-snug">{t[language].delayDesc}</p>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-800 rounded-xl flex items-start gap-2.5">
                              <span className="h-4 w-4 shrink-0 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold font-mono text-[9px]">2</span>
                              <div className="text-[9px] font-sans text-right flex-1">
                                <h5 className="font-bold text-slate-200 leading-none">{t[language].cbtDefense}</h5>
                                <p className="text-slate-400 mt-1 leading-snug">{t[language].cbtDesc}</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center" id="device-empty-state">
                  <Inbox className="text-slate-400 stroke-1" size={48} />
                  <p className="font-sans text-xs text-slate-400 mt-2">Create clinical clients to enable mobile simulation.</p>
                </div>
              )}
            </div>

            {/* BOTTOM NAV BAR INTERFACE WITHIN SMARTPHONE SCREEN (ONLY INTERACTIVE ON DISCHARGED APP STATE) */}
            <div className={`h-14 bg-slate-950 px-6 border-t border-slate-800 flex justify-around items-center z-20 shrink-0 ${!isDischarged ? 'opacity-30 pointer-events-none' : ''}`} id="phone-bottom-nav">
              <button
                id="phone-nav-home"
                onClick={() => setMobileTab('home')}
                className={`flex flex-col items-center gap-1 ${
                  mobileTab === 'home' ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <Smartphone size={15} />
                <span className="text-[8px] font-sans font-semibold">{t[language].navHome}</span>
              </button>

              <button
                id="phone-nav-coping"
                onClick={() => setMobileTab('coping')}
                className={`flex flex-col items-center gap-1 ${
                  mobileTab === 'coping' ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <Activity size={15} />
                <span className="text-[8px] font-sans font-semibold">{t[language].navCoping}</span>
              </button>

              <button
                id="phone-nav-sos"
                onClick={() => setSosActive(true)}
                className="flex flex-col items-center gap-1 text-rose-500 animate-pulse"
              >
                <Phone size={15} />
                <span className="text-[8px] font-sans font-bold uppercase tracking-tight">{t[language].navSos}</span>
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
