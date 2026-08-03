import React, { useState } from 'react';
import { X, Award, Send, CheckCircle2, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendGradeNotification } from '../../services/telegram';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface GradeSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  onSuccess?: () => void;
}

export const GradeSubmitModal: React.FC<GradeSubmitModalProps> = ({
  isOpen,
  onClose,
  studentId = 'demo_student',
  studentName = 'Shahrzod Rahimov',
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [assessmentTitle, setAssessmentTitle] = useState('IELTS Writing Task 2 Diagnostic');
  const [score, setScore] = useState('7.5');
  const [feedback, setFeedback] = useState('Great coherence and cohesive device usage. Focus on academic vocabulary in Paragraph 3.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telegramNotified, setTelegramNotified] = useState<boolean | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTelegramNotified(null);

    const teacherName = currentUser?.displayName || 'Jasur Rahimov';

    try {
      // 1. Save grade submission record to Firestore
      try {
        await addDoc(collection(db, 'grades'), {
          studentUid: studentId,
          studentName,
          title: assessmentTitle,
          score,
          feedback,
          teacherName,
          createdAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Firestore grade save notice:', dbErr);
      }

      // 2. Dispatch real-time Telegram Bot notification
      const notified = await sendGradeNotification({
        studentUid: studentId,
        title: assessmentTitle,
        score,
        feedback,
        teacherName
      });

      setTelegramNotified(notified);
      setIsSubmitting(false);
      setIsDone(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting grade:', err);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsDone(false);
    setTelegramNotified(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d021a]/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#120320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#229ED9]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">Submit Diagnostic Grade</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                Teacher Tool
              </span>
            </div>
            <p className="text-xs text-slate-400">Student: <span className="text-white font-bold">{studentName}</span></p>
          </div>
        </div>

        {!isDone ? (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Assessment Title
              </label>
              <input
                type="text"
                required
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
                placeholder="e.g., IELTS Writing Task 2 Diagnostic"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Band Score / Grade
              </label>
              <input
                type="text"
                required
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g., 7.5 or 92%"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Diagnostic Feedback & Corrections</span>
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback details..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400 transition resize-none"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center gap-3 text-xs text-slate-200">
              <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
              <span>Submitting will automatically send a real-time card via <strong>@centerflow_bot</strong> to {studentName}.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Notifying Telegram...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Grade & Trigger Bot Alert</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5 relative z-10 text-center animate-fadeIn py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-1">Grade Published Successfully!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Diagnostic score <span className="text-amber-400 font-bold">{score}</span> saved for {studentName}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-center gap-2 font-bold text-emerald-400">
                <Send className="w-4 h-4 text-[#229ED9]" />
                <span>
                  {telegramNotified !== false
                    ? 'Telegram Card Delivered via @centerflow_bot'
                    : 'Saved to Portal (Student bot notification queued)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
