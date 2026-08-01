import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  FileText,
  Paperclip,
  Download,
  Sparkles,
  Sliders,
  Send,
  MessageSquare,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Zap,
  HelpCircle,
  Maximize2,
  RotateCw,
  Volume2,
  FileCode,
  Camera
} from 'lucide-react';
import { HomeworkSubmission } from '../../types';
import { gradeHomeworkSubmission } from '../../services/firestore';
import { useLanguage } from '../../context/LanguageContext';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: HomeworkSubmission | null;
  onGradeSubmitted?: (submissionId: string, updatedData: any) => void;
  teacherName?: string;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  onClose,
  submission,
  onGradeSubmitted,
  teacherName = 'Mr. Javohirbek'
}) => {
  const { t } = useLanguage();

  // Mode: IELTS Band vs Points / Percentage
  const [gradingSystem, setGradingSystem] = useState<'IELTS Band' | 'Points / Percentage'>('IELTS Band');

  // IELTS Sub-scores (0.5 increments, 1.0 to 9.0)
  const [taskAchievement, setTaskAchievement] = useState<number>(7.0);
  const [coherenceCohesion, setCoherenceCohesion] = useState<number>(7.0);
  const [lexicalResource, setLexicalResource] = useState<number>(7.0);
  const [grammaticalAccuracy, setGrammaticalAccuracy] = useState<number>(7.0);

  // Point Scoring
  const [scorePoints, setScorePoints] = useState<number>(85);
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [rubricStatus, setRubricStatus] = useState<'Pass' | 'Merit' | 'Distinction' | 'Needs Revision'>('Pass');

  // Feedback & File Link
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [correctedFileName, setCorrectedFileName] = useState<string>('');
  const [correctedFileUrl, setCorrectedFileUrl] = useState<string>('');

  // UI States
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedSuccess, setPublishedSuccess] = useState<boolean>(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [rotationMap, setRotationMap] = useState<Record<string, number>>({});

  // Initialize form state from existing submission if graded
  useEffect(() => {
    if (submission) {
      if (submission.feedback) {
        setFeedbackText(submission.feedback);
      } else {
        setFeedbackText('');
      }

      if (submission.gradingSystem === 'Points / Percentage') {
        setGradingSystem('Points / Percentage');
      } else {
        setGradingSystem('IELTS Band');
      }

      if (submission.breakdown) {
        if (submission.breakdown.taskAchievement) setTaskAchievement(submission.breakdown.taskAchievement);
        if (submission.breakdown.coherenceCohesion) setCoherenceCohesion(submission.breakdown.coherenceCohesion);
        if (submission.breakdown.lexicalResource) setLexicalResource(submission.breakdown.lexicalResource);
        if (submission.breakdown.grammaticalAccuracy) setGrammaticalAccuracy(submission.breakdown.grammaticalAccuracy);

        if (submission.breakdown.points !== undefined) setScorePoints(submission.breakdown.points);
        if (submission.breakdown.maxPoints !== undefined) setMaxPoints(submission.breakdown.maxPoints);
      } else if (typeof submission.score === 'number') {
        setScorePoints(submission.score);
      }

      if (submission.rubricStatus) {
        setRubricStatus(submission.rubricStatus as any);
      }

      if (submission.correctedFileName) setCorrectedFileName(submission.correctedFileName);
      if (submission.correctedFileUrl) setCorrectedFileUrl(submission.correctedFileUrl);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  // Rounding helper according to official IELTS band rules
  const calculateIELTSBand = (): number => {
    const rawAvg = (taskAchievement + coherenceCohesion + lexicalResource + grammaticalAccuracy) / 4;
    const integerPart = Math.floor(rawAvg);
    const fraction = rawAvg - integerPart;

    if (fraction >= 0.75) {
      return integerPart + 1.0;
    } else if (fraction >= 0.25) {
      return integerPart + 0.5;
    } else {
      return integerPart;
    }
  };

  const currentIELTSBand = calculateIELTSBand();

  const getIELTSBandDescriptor = (band: number): string => {
    if (band >= 8.5) return 'Expert / Native Competence';
    if (band >= 8.0) return 'Very Good User';
    if (band >= 7.5) return 'Good User (C1 Advanced)';
    if (band >= 7.0) return 'Good User (B2+)';
    if (band >= 6.5) return 'Competent User (B2)';
    if (band >= 6.0) return 'Competent User (B1+)';
    if (band >= 5.5) return 'Modest User (B1)';
    return 'Limited User';
  };

  const cannedFeedbackPills = [
    "✨ Excellent structure and logical flow!",
    "📚 Strong vocabulary range & natural collocations.",
    "⚠️ Pay attention to article usage (a/an/the) and prepositions.",
    "💡 Expand your main body paragraphs with specific examples.",
    "🎯 Accurate grammar with good range of complex sentences.",
    "🔄 Needs revision on cohesion & connecting phrases."
  ];

  const handleAppendFeedback = (pillText: string) => {
    if (!feedbackText) {
      setFeedbackText(pillText);
    } else if (feedbackText.includes(pillText)) {
      // Avoid duplicate pill insertion
      return;
    } else {
      setFeedbackText((prev) => `${prev}\n\n${pillText}`);
    }
  };

  const handlePublishGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);

    try {
      const isIELTS = gradingSystem === 'IELTS Band';
      const finalScore = isIELTS ? `Band ${currentIELTSBand}` : `${scorePoints} / ${maxPoints} (${rubricStatus})`;

      const breakdown = isIELTS
        ? {
            taskAchievement,
            coherenceCohesion,
            lexicalResource,
            grammaticalAccuracy
          }
        : {
            points: scorePoints,
            maxPoints,
            rubricStatus
          };

      const gradePayload = {
        status: 'graded' as const,
        score: finalScore,
        gradingSystem,
        breakdown,
        rubricStatus: isIELTS ? `Band ${currentIELTSBand}` : rubricStatus,
        feedback: feedbackText || 'Good effort on this solution! Keep practicing.',
        teacherName,
        studentId: submission.studentId,
        studentName: submission.studentName,
        assignmentTitle: submission.assignmentTitle,
        correctedFileName,
        correctedFileUrl
      };

      const success = await gradeHomeworkSubmission(submission.id, gradePayload);

      if (success) {
        setPublishedSuccess(true);
        if (onGradeSubmitted) {
          onGradeSubmitted(submission.id, gradePayload);
        }
        setTimeout(() => {
          setPublishedSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Error publishing grade:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full p-6 shadow-2xl space-y-6 max-h-[94vh] flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {submission.groupName || 'Group Submission'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Submitted: {submission.date || submission.submittedAt || 'Today'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <span>Evaluate Submission:</span>
                <span className="text-amber-600 dark:text-amber-400">{submission.studentName}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual-Pane Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
          
          {/* LEFT PANE: Student Solution Viewer */}
          <div className="lg:col-span-6 space-y-4 flex flex-col">
            
            {/* Meta Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assignment</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {submission.assignmentTitle}
                </h3>
              </div>
              <div>
                {submission.status === 'graded' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Graded: {submission.score || submission.grade || 'Published'}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pending Evaluation</span>
                  </span>
                )}
              </div>
            </div>

            {/* Rich Solution Container */}
            <div className="flex-1 min-h-[260px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 overflow-y-auto space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="font-extrabold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Student Solution / Response
                </span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                  Rich-Text Formatting
                </span>
              </div>

              {submission.solutionText ? (
                submission.solutionText.includes('<') ? (
                  <div
                    className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none font-sans overflow-x-auto leading-relaxed pt-1"
                    dangerouslySetInnerHTML={{ __html: submission.solutionText }}
                  />
                ) : (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-1 font-sans">
                    {submission.solutionText}
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-slate-400 italic text-xs">
                  No text response included in this submission.
                </div>
              )}
            </div>

            {/* Multi-Format Media Attachments Gallery */}
            {submission.attachments && submission.attachments.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                  <span>Student Multi-Subject Attachments ({submission.attachments.length})</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {submission.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                    >
                      {/* Image Notebook Scan */}
                      {att.type === 'image' && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center group">
                          <img
                            src={att.url}
                            alt={att.name}
                            style={{ transform: `rotate(${rotationMap[att.id] || att.rotation || 0}deg)` }}
                            className="w-full h-full object-contain transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setRotationMap((prev) => ({
                                  ...prev,
                                  [att.id]: ((prev[att.id] || att.rotation || 0) + 90) % 360
                                }))
                              }
                              className="p-2 rounded-xl bg-white/20 text-white hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                              title="Rotate Scan"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="p-2 rounded-xl bg-white/20 text-white hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                              title="Zoom Fullscreen Lightbox"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Audio Oral Recitation */}
                      {att.type === 'audio' && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Volume2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{att.name}</span>
                          </div>
                          <audio src={att.url} controls className="w-full h-8 rounded-lg" />
                        </div>
                      )}

                      {/* Code / File Attachment */}
                      {(att.type === 'code' || att.type === 'file' || att.type === 'pdf') && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {att.type === 'code' ? <FileCode className="w-5 h-5 text-blue-500 shrink-0" /> : <FileText className="w-5 h-5 text-amber-500 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{att.name}</p>
                              <span className="text-[10px] text-slate-400">{att.size || 'File'}</span>
                            </div>
                          </div>
                          <a
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="truncate">{att.name}</span>
                        <span className="font-mono uppercase">{att.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : submission.fileName ? (
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      Submitted Attachment
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                      {submission.fileName}
                    </span>
                  </div>
                </div>

                {submission.fileUrl && (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition cursor-pointer shrink-0 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>
            ) : null}
          </div>

          {/* RIGHT PANE: Evaluation & Feedback Panel */}
          <div className="lg:col-span-6 space-y-5 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
            
            <form onSubmit={handlePublishGrade} className="space-y-5">
              
              {/* Subject Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    Grading System & Rubric Mode
                  </span>
                  <span className="text-[10px] font-bold text-amber-500">
                    {gradingSystem}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 dark:bg-slate-900/80 rounded-2xl border border-slate-300/50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGradingSystem('IELTS Band')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      gradingSystem === 'IELTS Band'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>IELTS Band (1.0 - 9.0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradingSystem('Points / Percentage')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      gradingSystem === 'Points / Percentage'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Point / Percentage</span>
                  </button>
                </div>
              </div>

              {/* MODE A: IELTS Band Assessment */}
              {gradingSystem === 'IELTS Band' ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  
                  {/* Overall Band Banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                        Calculated Overall Band
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {getIELTSBandDescriptor(currentIELTSBand)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {currentIELTSBand.toFixed(1)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ 9.0</span>
                    </div>
                  </div>

                  {/* 4 Sub-criteria sliders/pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    
                    {/* Criteria 1 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Task Achievement</span>
                        <span className="font-black text-amber-500">{taskAchievement.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={taskAchievement}
                        onChange={(e) => setTaskAchievement(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>

                    {/* Criteria 2 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Coherence & Cohesion</span>
                        <span className="font-black text-amber-500">{coherenceCohesion.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={coherenceCohesion}
                        onChange={(e) => setCoherenceCohesion(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>

                    {/* Criteria 3 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Lexical Resource</span>
                        <span className="font-black text-amber-500">{lexicalResource.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={lexicalResource}
                        onChange={(e) => setLexicalResource(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>

                    {/* Criteria 4 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Grammar & Accuracy</span>
                        <span className="font-black text-amber-500">{grammaticalAccuracy.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={grammaticalAccuracy}
                        onChange={(e) => setGrammaticalAccuracy(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>

                  </div>
                </div>
              ) : (
                /* MODE B: Point / Percentage Scoring */
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                        Achieved Points
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxPoints}
                        value={scorePoints}
                        onChange={(e) => setScorePoints(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-black text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                        Total Points
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxPoints}
                        onChange={(e) => setMaxPoints(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-black text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Rubric Status Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Rubric Outcome Status
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['Distinction', 'Merit', 'Pass', 'Needs Revision'] as const).map((status) => (
                        <button
                          type="button"
                          key={status}
                          onClick={() => setRubricStatus(status)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                            rubricStatus === status
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-amber-500'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Commentary Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    Teacher Commentary & Feedback
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Markdown / Text</span>
                </div>

                {/* Quick Canned Feedback Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {cannedFeedbackPills.map((pill, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleAppendFeedback(pill)}
                      className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold whitespace-nowrap transition cursor-pointer border border-amber-500/20 shrink-0"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide constructive feedback, highlight key errors, and outline actionable improvement steps..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              {/* Optional Reference Document Attachment Link */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Optional Corrected Solution File Link
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={correctedFileName}
                    onChange={(e) => setCorrectedFileName(e.target.value)}
                    placeholder="e.g. Essay_Correction_Note.pdf"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    value={correctedFileUrl}
                    onChange={(e) => setCorrectedFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Action Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPublishing || publishedSuccess}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                    publishedSuccess
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 active:scale-[0.98]'
                  }`}
                >
                  {isPublishing ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : publishedSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Grade & Notification Published!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish Grade & Feedback</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>

      {/* Lightbox Modal for Teacher Inspection */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-4 relative">
            <button
              onClick={() => setPreviewAttachment(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-rose-500 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative max-h-[80vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-2">
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                style={{
                  transform: `rotate(${rotationMap[previewAttachment.id] || previewAttachment.rotation || 0}deg)`
                }}
                className="max-h-[75vh] w-auto object-contain mx-auto transition-transform duration-300"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700 text-xs text-white">
              <span className="font-bold">{previewAttachment.name}</span>
              <button
                type="button"
                onClick={() =>
                  setRotationMap((prev) => ({
                    ...prev,
                    [previewAttachment.id]: ((prev[previewAttachment.id] || previewAttachment.rotation || 0) + 90) % 360
                  }))
                }
                className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center gap-1 hover:bg-amber-400 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 90°</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
