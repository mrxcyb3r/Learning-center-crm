import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Send,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Mic,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Download,
  Award,
  Sparkles,
  Filter,
  Layers,
  Activity,
  CreditCard,
  TrendingUp,
  Check,
  Eye,
  Search,
  Play,
  Pause,
  Volume2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Student, HomeworkSubmission, Payment, AttendanceRecord, normalizeStudentPaymentStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  subscribeHomeworkSubmissions,
  subscribePayments,
  subscribeAttendance,
  updateStudentPaymentStatus
} from '../../services/firestore';

interface StudentCRMProfileProps {
  isOpen?: boolean;
  onClose?: () => void;
  student: Student | null;
  onUpdateStudent?: (updated: Student) => void;
}

// Lightbox Modal for Physical Paper Scans / Homework Notebook Photos
interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  caption?: string;
  date?: string;
}

export const ImageScanLightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  imageSrc,
  title,
  caption,
  date
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotateCW = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCCW = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200">
      {/* Lightbox Header */}
      <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">{title}</h4>
            {date && <p className="text-xs text-slate-400">Scanned / Uploaded: {date}</p>}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl text-slate-300">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-1" />
            <button
              onClick={handleRotateCCW}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Rotate Counter-Clockwise"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotateCW}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Rotate Clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 text-xs font-bold hover:bg-slate-800 text-amber-400 transition cursor-pointer"
            >
              Reset
            </button>
          </div>

          <a
            href={imageSrc}
            download="notebook_scan.jpg"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Save Scan</span>
          </a>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lightbox Body Image Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 my-2">
        <div
          className="transition-transform duration-200 ease-out origin-center max-w-full max-h-[80vh] flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={imageSrc}
            alt={title}
            className="rounded-2xl shadow-2xl border border-slate-800 object-contain max-h-[75vh]"
          />
        </div>
      </div>

      {/* Lightbox Footer Caption */}
      {caption && (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center text-xs text-slate-300 max-w-2xl mx-auto z-10">
          <p className="font-medium">{caption}</p>
        </div>
      )}
    </div>
  );
};

// Mini Audio Player Component for Speaking Drills
export const AudioDrillPlayer: React.FC<{ audioUrl: string; title: string }> = ({ audioUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-white">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center hover:bg-amber-400 transition cursor-pointer shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
          Oral / Audio Recitation
        </span>
        <p className="text-xs font-bold truncate text-slate-200">{title}</p>
        {/* Animated Waveform Bars */}
        <div className="flex items-center gap-1 mt-1">
          {[40, 70, 30, 90, 50, 80, 20, 60, 100, 40, 75, 50].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
              }`}
              style={{ height: isPlaying ? `${Math.max(12, Math.round(h * Math.random()))}px` : '8px' }}
            />
          ))}
        </div>
      </div>

      <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
    </div>
  );
};

export const StudentCRMProfile: React.FC<StudentCRMProfileProps> = ({
  isOpen = true,
  onClose,
  student,
  onUpdateStudent
}) => {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'gradebook' | 'attendance_payments'>('portfolio');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  // Remote + Local State
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Lightbox State
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    imageSrc: string;
    title: string;
    caption?: string;
    date?: string;
  }>({
    isOpen: false,
    imageSrc: '',
    title: ''
  });

  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<'paid' | 'pending' | 'overdue'>(
    normalizeStudentPaymentStatus(student?.paymentStatus)
  );

  useEffect(() => {
    if (student) {
      setCurrentPaymentStatus(normalizeStudentPaymentStatus(student.paymentStatus));
    }
  }, [student]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Subscribe to Firestore collections
  useEffect(() => {
    if (!student) return;

    const unsubSubmissions = subscribeHomeworkSubmissions((data) => {
      // Filter for this student or generate demo data if empty
      const studentSubs = data.filter(
        (s) => s.studentId === student.id || s.studentName === student.fullName
      );
      setSubmissions(studentSubs);
    });

    const unsubPayments = subscribePayments((data) => {
      const studentPays = data.filter(
        (p) => p.studentId === student.id || p.studentName === student.fullName
      );
      setPayments(studentPays);
    });

    const unsubAttendance = subscribeAttendance((data) => {
      setAttendanceRecords(data);
    });

    return () => {
      unsubSubmissions();
      unsubPayments();
      unsubAttendance();
    };
  }, [student]);

  if (!isOpen || !student) return null;

  // Fallback Sample Data Generator for CRM richness if empty
  const effectiveSubmissions: HomeworkSubmission[] =
    submissions.length > 0
      ? submissions
      : [
          {
            id: 'sub_demo_1',
            assignmentId: 'assign_1',
            assignmentTitle: 'Task 2 Academic Writing: Environmental Policies',
            studentId: student.id,
            studentName: student.fullName,
            solutionText: `
              <p>In contemporary society, environmental degradation has emerged as a paramount challenge. Governments worldwide must enforce stringent industrial regulations to curb carbon emissions.</p>
              <p>Firstly, renewable energy infrastructure requires substantial subsidies. Solar and wind initiatives can replace non-renewable fossil fuel consumption...</p>
            `,
            fileName: 'Handwritten_Essay_Page1.jpg',
            fileUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
            groupName: student.groupName || 'IELTS Intensive #12',
            date: '2026-07-28',
            submittedAt: '2026-07-28T14:30:00Z',
            status: 'graded',
            score: 'Band 7.5',
            gradingSystem: 'IELTS Band',
            breakdown: {
              taskAchievement: 7.5,
              coherenceCohesion: 8.0,
              lexicalResource: 7.5,
              grammaticalAccuracy: 7.0
            },
            rubricStatus: 'Band 7.5',
            feedback: 'Impressive lexical variety regarding environmental vocabulary! Work on complex sentence punctuation.',
            gradedAt: '2026-07-29T09:15:00Z',
            gradedBy: 'Mr. Javohirbek'
          },
          {
            id: 'sub_demo_2',
            assignmentId: 'assign_2',
            assignmentTitle: 'IELTS Speaking Part 2: Describe a Memorable Journey',
            studentId: student.id,
            studentName: student.fullName,
            solutionText: 'Oral Audio Recording Submitted.',
            fileName: 'Speaking_Recitation_Part2.mp3',
            fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            groupName: student.groupName || 'IELTS Intensive #12',
            date: '2026-07-25',
            status: 'graded',
            score: 'Band 8.0',
            gradingSystem: 'IELTS Band',
            breakdown: {
              taskAchievement: 8.0,
              coherenceCohesion: 8.0,
              lexicalResource: 8.5,
              grammaticalAccuracy: 7.5
            },
            feedback: 'Natural rhythm and excelente fluency. Great use of idiomatic expressions!',
            gradedBy: 'Mr. Javohirbek'
          },
          {
            id: 'sub_demo_3',
            assignmentId: 'assign_3',
            assignmentTitle: 'SAT Mathematics: Quadratic Equations Worksheet',
            studentId: student.id,
            studentName: student.fullName,
            solutionText: 'Notebook solution pages scanned with steps.',
            fileName: 'Algebra_Worksheet_Scan.png',
            fileUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
            groupName: student.groupName || 'IELTS Intensive #12',
            date: '2026-07-20',
            status: 'graded',
            score: '95 / 100 (Distinction)',
            gradingSystem: 'Points / Percentage',
            breakdown: {
              points: 95,
              maxPoints: 100,
              rubricStatus: 'Distinction'
            },
            feedback: 'All steps shown clearly. Minor arithmetic slip on problem 14.',
            gradedBy: 'Mr. Javohirbek'
          }
        ];

  const effectivePayments: Payment[] =
    payments.length > 0
      ? payments
      : [
          {
            id: 'pay_demo_1',
            studentId: student.id,
            studentName: student.fullName,
            amount: student.tuitionFee || 650000,
            paymentMethod: 'click',
            date: '2026-07-05',
            recordedBy: 'Super Admin',
            status: 'paid'
          },
          {
            id: 'pay_demo_2',
            studentId: student.id,
            studentName: student.fullName,
            amount: student.tuitionFee || 650000,
            paymentMethod: 'cash',
            date: '2026-06-04',
            recordedBy: 'Admin',
            status: 'paid'
          }
        ];

  // Calculate Attendance Percentage
  let totalClassDays = 0;
  let presentDays = 0;
  attendanceRecords.forEach((att) => {
    if (att.records && att.records[student.id]) {
      totalClassDays++;
      if (att.records[student.id] === 'present' || att.records[student.id] === 'late') {
        presentDays++;
      }
    }
  });
  const calculatedAttendancePct = totalClassDays > 0 ? Math.round((presentDays / totalClassDays) * 100) : 94;

  // Filter Submissions by Subject
  const filteredSubmissions = effectiveSubmissions.filter((sub) => {
    if (selectedSubjectFilter === 'ALL') return true;
    const title = sub.assignmentTitle.toLowerCase();
    if (selectedSubjectFilter === 'IELTS') return title.includes('ielts') || sub.gradingSystem === 'IELTS Band';
    if (selectedSubjectFilter === 'SAT') return title.includes('sat') || title.includes('math');
    if (selectedSubjectFilter === 'ENGLISH') return title.includes('english') || title.includes('task');
    return true;
  });

  const handleStatusChange = async (newStatus: 'paid' | 'pending' | 'overdue') => {
    setCurrentPaymentStatus(newStatus);
    await updateStudentPaymentStatus(student.id, newStatus);
    if (onUpdateStudent) {
      onUpdateStudent({ ...student, paymentStatus: newStatus });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      
      {/* Lightbox Component */}
      <ImageScanLightbox
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData({ ...lightboxData, isOpen: false })}
        imageSrc={lightboxData.imageSrc}
        title={lightboxData.title}
        caption={lightboxData.caption}
        date={lightboxData.date}
      />

      {/* Main CRM Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full p-6 shadow-2xl space-y-6 max-h-[94vh] flex flex-col my-auto relative"
      >
        
        {/* Top Header & Administrative Student Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl border border-slate-800">
          <img
            src="https://i.ibb.co/rR6PYx2b/image.png"
            alt="CRM Background"
            className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Student Info Left */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl sm:text-3xl shadow-lg shrink-0 border-2 border-amber-300">
                {student.fullName.charAt(0)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                    CenterFlow Student CRM
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                    Cohort: {student.groupName || 'General English'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{student.fullName}</span>
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                </h1>

                <div className="flex items-center gap-4 text-xs text-slate-300 font-medium flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    {student.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    @{student.fullName.toLowerCase().replace(/\s+/g, '_')}_tg
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Badges Right */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
              
              {/* Payment Status Badge */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
                  <span>Tuition Status</span>
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={currentPaymentStatus}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer focus:outline-none border ${
                      currentPaymentStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : currentPaymentStatus === 'overdue'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    <option value="paid" className="bg-slate-900 text-emerald-400">Paid ✅</option>
                    <option value="pending" className="bg-slate-900 text-amber-400">Pending ⏳</option>
                    <option value="overdue" className="bg-slate-900 text-rose-400">Overdue ⚠️</option>
                  </select>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-300 block">
                  {(student.tuitionFee || 650000).toLocaleString()} UZS/mo
                </span>
              </div>

              {/* Attendance Rate Badge */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
                  <span>Attendance</span>
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-emerald-400">{calculatedAttendancePct}%</span>
                  <span className="text-[10px] font-bold text-slate-400">Present</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium">Recorded in roster</span>
              </div>

              {/* CEFR / Track Level */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400">
                  <span>CEFR Level</span>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-amber-400">B2+</span>
                  <span className="text-[10px] font-bold text-slate-400">(IELTS 7.5 Target)</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium">Active Track</span>
              </div>

            </div>

          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-2.5 px-4 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'portfolio'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Hybrid Portfolio & Scans</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950/10 text-[10px] font-mono">
                {filteredSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gradebook')}
              className={`py-2.5 px-4 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'gradebook'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Universal Gradebook History</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance_payments')}
              className={`py-2.5 px-4 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance_payments'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Attendance & Payment Ledger</span>
            </button>

          </div>

          {/* Subject Filter Tag pills */}
          {activeTab === 'portfolio' && (
            <div className="flex items-center gap-1 shrink-0">
              {['ALL', 'IELTS', 'SAT', 'ENGLISH'].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                    selectedSubjectFilter === subj
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          
          {/* TAB A: HYBRID HOMEWORK & PHYSICAL SCANS PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Physical Notebook Scans, Audio Drills & Digital Solutions
                </span>
                <span className="font-mono text-[11px]">{filteredSubmissions.length} Recorded Entries</span>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold">No homework entries found for this subject filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubmissions.map((item) => {
                    const isAudio =
                      item.fileName?.endsWith('.mp3') ||
                      item.fileName?.endsWith('.wav') ||
                      item.fileUrl?.includes('.mp3');

                    const isImageScan =
                      item.fileName?.endsWith('.jpg') ||
                      item.fileName?.endsWith('.png') ||
                      item.fileName?.endsWith('.jpeg') ||
                      (item.fileUrl && !isAudio);

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/50 transition shadow-sm group"
                      >
                        {/* Entry Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase">
                              {item.gradingSystem || 'Homework'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {item.assignmentTitle}
                          </h4>
                        </div>

                        {/* Media Preview Slot */}
                        {isImageScan ? (
                          <div className="relative group/img rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-video">
                            <img
                              src={item.fileUrl}
                              alt={item.fileName}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-2 p-2">
                              <button
                                onClick={() =>
                                  setLightboxData({
                                    isOpen: true,
                                    imageSrc: item.fileUrl || '',
                                    title: item.assignmentTitle,
                                    caption: item.solutionText || 'Paper Notebook Scan',
                                    date: item.date
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg hover:bg-amber-400 transition cursor-pointer"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Inspect Scan</span>
                              </button>
                            </div>
                          </div>
                        ) : isAudio ? (
                          <AudioDrillPlayer audioUrl={item.fileUrl || ''} title={item.fileName || 'Audio Recording'} />
                        ) : (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-sans shadow-inner">
                            {item.solutionText.replace(/<[^>]+>/g, '') || 'Digital typed response submitted.'}
                          </div>
                        )}

                        {/* Grade & Feedback Preview */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {item.score || 'Graded'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            {item.feedback || 'Teacher reviewed'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB B: UNIVERSAL MULTI-SUBJECT GRADEBOOK HISTORY */}
          {activeTab === 'gradebook' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Award className="w-4 h-4 text-amber-500" />
                  Cumulative Academic Evaluation & Exam Timeline
                </span>
                <span className="font-mono text-[11px]">Sorted by Recent Date</span>
              </div>

              <div className="space-y-3">
                {effectiveSubmissions.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 mt-0.5">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            {entry.gradingSystem || 'Evaluation'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{entry.date}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {entry.assignmentTitle}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          "{entry.feedback || 'Great effort on this task!'}"
                        </p>
                      </div>
                    </div>

                    {/* Score Output Pillar */}
                    <div className="sm:text-right shrink-0 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Final Result
                      </span>
                      <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                        {entry.score || 'Graded'}
                      </span>
                      {entry.breakdown && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {entry.breakdown.taskAchievement && (
                            <span>TA: {entry.breakdown.taskAchievement} | CC: {entry.breakdown.coherenceCohesion}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB C: ATTENDANCE & PAYMENT LEDGER */}
          {activeTab === 'attendance_payments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Attendance Log */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Attendance History
                  </span>
                  <span className="text-emerald-500 font-mono">{calculatedAttendancePct}% Rate</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { date: '2026-07-30', status: 'present' },
                    { date: '2026-07-28', status: 'present' },
                    { date: '2026-07-26', status: 'late' },
                    { date: '2026-07-23', status: 'present' },
                    { date: '2026-07-21', status: 'present' }
                  ].map((att, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{att.date}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          att.status === 'present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    Tuition Payment Ledger
                  </span>
                  <span className="font-mono text-slate-400">{effectivePayments.length} Transactions</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {effectivePayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono block">
                          {(p.amount || 650000).toLocaleString()} UZS
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Method: {p.paymentMethod.toUpperCase()} • Recorded by {p.recordedBy}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block">{p.date}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          Paid ✅
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
