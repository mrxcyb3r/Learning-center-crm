import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { HomeworkSubmission, SubmissionAttachment } from '../../types';
import { ImageScanLightbox, AudioDrillPlayer } from './StudentCRMProfile';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  Sparkles,
  Zap,
  Maximize2,
  Code,
  Check,
  AlertTriangle,
  Lightbulb,
  X,
  FileCheck,
  Percent,
  ExternalLink
} from 'lucide-react';

interface StudentSubmissionViewProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
  initialSubmission?: HomeworkSubmission | null;
}

export const StudentSubmissionView: React.FC<StudentSubmissionViewProps> = ({
  isOpen,
  onClose,
  submissionId,
  initialSubmission
}) => {
  const [submissionData, setSubmissionData] = useState<HomeworkSubmission | null>(
    initialSubmission || null
  );
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    imageSrc: string;
    title: string;
  }>({
    isOpen: false,
    imageSrc: '',
    title: ''
  });

  // Listen for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-Time Submission Listener (onSnapshot)
  useEffect(() => {
    if (!submissionId) {
      if (initialSubmission) setSubmissionData(initialSubmission);
      return;
    }

    // Subscribe to Firestore homework_submissions collection
    const unsub = onSnapshot(
      doc(db, 'homework_submissions', submissionId),
      (docSnap) => {
        if (docSnap.exists()) {
          setSubmissionData({ id: docSnap.id, ...docSnap.data() } as HomeworkSubmission);
        }
      },
      (err) => {
        console.warn('Real-time submission listener notice:', err);
      }
    );

    return () => unsub();
  }, [submissionId, initialSubmission]);

  if (!isOpen || !submissionData) return null;

  const b = submissionData.breakdown || {};
  const isAudio = (name?: string, url?: string) => {
    const target = (name || url || '').toLowerCase();
    return target.endsWith('.mp3') || target.endsWith('.wav') || target.endsWith('.m4a') || target.endsWith('.ogg');
  };

  const isImage = (name?: string, url?: string) => {
    const target = (name || url || '').toLowerCase();
    return target.endsWith('.jpg') || target.endsWith('.png') || target.endsWith('.jpeg') || target.endsWith('.webp');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Lightbox for Image Scans */}
      <ImageScanLightbox
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
        imageSrc={lightbox.imageSrc}
        title={lightbox.title}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] flex flex-col my-auto relative overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">
                  {submissionData.gradingSystem || 'Graded Submission'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {submissionData.date || submissionData.submittedAt}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {submissionData.assignmentTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1">
          {/* Main Grade Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/5 to-amber-500/10 border border-amber-500/20 dark:bg-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official Result & Evaluation
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {submissionData.score || submissionData.grade || 'Graded'}
              </div>
              {submissionData.gradedBy && (
                <p className="text-xs text-slate-500 font-medium">
                  Evaluated by <span className="font-bold text-slate-800 dark:text-slate-200">{submissionData.gradedBy}</span>
                </p>
              )}
            </div>

            {/* Status Pill */}
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Grade Published</span>
            </div>
          </div>

          {/* Dynamic Subject Rubric Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Rubric Assessment Breakdown
            </h3>

            {/* IELTS Band */}
            {submissionData.gradingSystem?.includes('IELTS') && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Task Achievement</span>
                  <span className="text-base font-black text-amber-500">{b.taskAchievement || '7.0'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Coherence & Cohesion</span>
                  <span className="text-base font-black text-amber-500">{b.coherenceCohesion || '7.5'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Lexical Resource</span>
                  <span className="text-base font-black text-amber-500">{b.lexicalResource || '7.0'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Grammar & Accuracy</span>
                  <span className="text-base font-black text-amber-500">{b.grammaticalAccuracy || '7.0'}</span>
                </div>
              </div>
            )}

            {/* STEM / Math */}
            {submissionData.gradingSystem?.includes('STEM') && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Methodology & Formulas</span>
                  <span className="text-base font-black text-blue-500">{b.formulaChoice || 5} / 5</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Calculation Accuracy</span>
                  <span className="text-base font-black text-blue-500">{b.calculationAccuracy || 5} / 5</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Logic & Formatting</span>
                  <span className="text-base font-black text-blue-500">{b.logicFormatting || 5} / 5</span>
                </div>
              </div>
            )}

            {/* IT / Code Review */}
            {submissionData.gradingSystem?.includes('IT') && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Execution</span>
                  <span className={`text-xs font-black uppercase ${b.codeExecutionPass !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {b.codeExecutionPass !== false ? 'Pass ✅' : 'Fail ❌'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Code Quality</span>
                  <span className="text-base font-black text-cyan-500">{b.codeReadability || 5} / 5</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Efficiency</span>
                  <span className="text-base font-black text-cyan-500">{b.algorithmEfficiency || 5} / 5</span>
                </div>
              </div>
            )}

            {/* CEFR & Points */}
            {(submissionData.gradingSystem?.includes('CEFR') || submissionData.gradingSystem?.includes('Points')) && (
              <div className="flex items-center gap-3 flex-wrap">
                {b.cefrLevel && (
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 font-black text-xs border border-indigo-500/20">
                    CEFR Band: {b.cefrLevel}
                  </span>
                )}
                {b.points !== undefined && (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 font-black text-xs border border-amber-500/20">
                    Score: {b.points} / {b.maxPoints || 100}
                  </span>
                )}
                {b.rubricStatus && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-black text-xs border border-emerald-500/20">
                    Status: {b.rubricStatus}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Teacher Commentary Card */}
          <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-slate-800/80 border border-amber-500/20 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Teacher Commentary & Detailed Feedback
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
              {submissionData.feedback || 'Teacher has reviewed your submission and recorded marks.'}
            </p>
          </div>

          {/* Corrected Solution File Download (If provided by Teacher) */}
          {(submissionData.correctedFileUrl || submissionData.correctedFileName) && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Annotated / Corrected Solution File Attached
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {submissionData.correctedFileName || 'Teacher_Corrected_Solution.pdf'}
                  </p>
                </div>
              </div>
              <a
                href={submissionData.correctedFileUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Corrected PDF</span>
              </a>
            </div>
          )}

          {/* Submitted Work Media & Text Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Submitted Work & Materials
            </h3>

            {/* Solution Text */}
            {submissionData.solutionText && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {submissionData.solutionText}
              </div>
            )}

            {/* Attachments */}
            {submissionData.attachments && submissionData.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {submissionData.attachments.map((att, idx) => {
                  if (isImage(att.name, att.url)) {
                    return (
                      <div
                        key={att.id || idx}
                        onClick={() =>
                          setLightbox({
                            isOpen: true,
                            imageSrc: att.url,
                            title: att.name
                          })
                        }
                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video group cursor-pointer bg-slate-950"
                      >
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2 text-white text-xs font-bold gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Inspect Image</span>
                        </div>
                      </div>
                    );
                  }

                  if (isAudio(att.name, att.url)) {
                    return (
                      <div key={att.id || idx} className="col-span-full">
                        <AudioDrillPlayer audioUrl={att.url} title={att.name} />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={att.id || idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {att.name}
                        </span>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
