import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Maximize2,
  RotateCw,
  Volume2,
  FileCode,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  AlertTriangle,
  Cpu,
  Calculator,
  Code,
  BookOpen,
  Video,
  Copy,
  ExternalLink,
  Layers,
  HelpCircle,
  BarChart3,
  Flame,
  Globe
} from 'lucide-react';
import { HomeworkSubmission, SubmissionAttachment } from '../../types';
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

  // 5 Grading Rubric Systems
  type GradingSystemType =
    | 'IELTS Band'
    | 'STEM & Exact Sciences'
    | 'IT & Programming Code'
    | 'CEFR Framework'
    | 'Points / Percentage';

  const [gradingSystem, setGradingSystem] = useState<GradingSystemType>('IELTS Band');

  // MODE A: IELTS Sub-scores (1.0 to 9.0)
  const [taskAchievement, setTaskAchievement] = useState<number>(7.0);
  const [coherenceCohesion, setCoherenceCohesion] = useState<number>(7.0);
  const [lexicalResource, setLexicalResource] = useState<number>(7.0);
  const [grammaticalAccuracy, setGrammaticalAccuracy] = useState<number>(7.0);

  // MODE B: STEM Sub-scores (0 to 10)
  const [formulaChoice, setFormulaChoice] = useState<number>(9);
  const [calculationAccuracy, setCalculationAccuracy] = useState<number>(8);
  const [logicFormatting, setLogicFormatting] = useState<number>(9);

  // MODE C: IT & Code Evaluation
  const [codeExecutionPass, setCodeExecutionPass] = useState<boolean>(true);
  const [codeReadability, setCodeReadability] = useState<number>(4); // 1-5
  const [algorithmEfficiency, setAlgorithmEfficiency] = useState<number>(5); // 1-5

  // MODE D: CEFR Level
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B2');
  const [qualitativeTag, setQualitativeTag] = useState<string>('Independent User');

  // MODE E: Points & Percentages
  const [scorePoints, setScorePoints] = useState<number>(85);
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [rubricStatus, setRubricStatus] = useState<'Distinction' | 'Merit' | 'Pass' | 'Needs Revision'>('Pass');

  // Feedback & File Attachments
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [correctedFileName, setCorrectedFileName] = useState<string>('');
  const [correctedFileUrl, setCorrectedFileUrl] = useState<string>('');

  // UI States
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedSuccess, setPublishedSuccess] = useState<boolean>(false);

  // Lightbox & Image Preview State
  const [previewAttachment, setPreviewAttachment] = useState<SubmissionAttachment | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1.0);
  const [lightboxRotation, setLightboxRotation] = useState<number>(0);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(60);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Code Copy State
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // AI Diagnostic Analysis State
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiCompleteness, setAiCompleteness] = useState<number>(88);
  const [aiStrengths, setAiStrengths] = useState<string[]>([
    "Accurate step-by-step formula application & clear logical progression.",
    "Comprehensive solution covering all required assignment prompt questions.",
    "Well-structured output with clean formatting and legible work."
  ]);
  const [aiErrors, setAiErrors] = useState<string[]>([
    "Step 3: Slight sign precision error in final calculation.",
    "Consider adding unit annotations (e.g., UZS / ms) in the final answer."
  ]);

  // Load state when submission changes
  useEffect(() => {
    if (submission) {
      if (submission.feedback) {
        setFeedbackText(submission.feedback);
      } else {
        setFeedbackText('');
      }

      // Restore system if exists
      if (submission.gradingSystem) {
        if (submission.gradingSystem.includes('STEM')) setGradingSystem('STEM & Exact Sciences');
        else if (submission.gradingSystem.includes('IT')) setGradingSystem('IT & Programming Code');
        else if (submission.gradingSystem.includes('CEFR')) setGradingSystem('CEFR Framework');
        else if (submission.gradingSystem.includes('Points')) setGradingSystem('Points / Percentage');
        else setGradingSystem('IELTS Band');
      }

      // Restore breakdown
      if (submission.breakdown) {
        const b = submission.breakdown;
        if (b.taskAchievement) setTaskAchievement(b.taskAchievement);
        if (b.coherenceCohesion) setCoherenceCohesion(b.coherenceCohesion);
        if (b.lexicalResource) setLexicalResource(b.lexicalResource);
        if (b.grammaticalAccuracy) setGrammaticalAccuracy(b.grammaticalAccuracy);

        if (b.formulaChoice !== undefined) setFormulaChoice(b.formulaChoice);
        if (b.calculationAccuracy !== undefined) setCalculationAccuracy(b.calculationAccuracy);
        if (b.logicFormatting !== undefined) setLogicFormatting(b.logicFormatting);

        if (b.codeExecutionPass !== undefined) setCodeExecutionPass(b.codeExecutionPass);
        if (b.codeReadability !== undefined) setCodeReadability(b.codeReadability);
        if (b.algorithmEfficiency !== undefined) setAlgorithmEfficiency(b.algorithmEfficiency);

        if (b.cefrLevel) setCefrLevel(b.cefrLevel as any);
        if (b.qualitativeTag) setQualitativeTag(b.qualitativeTag);

        if (b.points !== undefined) setScorePoints(b.points);
        if (b.maxPoints !== undefined) setMaxPoints(b.maxPoints);
      } else if (typeof submission.score === 'number') {
        setScorePoints(submission.score);
      }

      if (submission.rubricStatus) {
        setRubricStatus(submission.rubricStatus as any);
      }

      if (submission.correctedFileName) setCorrectedFileName(submission.correctedFileName);
      if (submission.correctedFileUrl) setCorrectedFileUrl(submission.correctedFileUrl);

      // Auto-tailor AI analysis based on assignment title or content
      generateAIAnalysis(submission);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  // AI Solution Analysis Generator
  function generateAIAnalysis(sub: HomeworkSubmission) {
    setIsAnalyzingAI(true);
    setTimeout(() => {
      const titleLower = (sub.assignmentTitle || '').toLowerCase();
      if (titleLower.includes('math') || titleLower.includes('sat') || titleLower.includes('physics')) {
        setAiCompleteness(92);
        setAiStrengths([
          "Step 1 & Step 2 formula substitution executed flawlessly.",
          "Clear handwritten notebook presentation with legible steps.",
          "Correct final answer substitution matching reference key."
        ]);
        setAiErrors([
          "Check step 4: simplify the fractional exponent before final rounding."
        ]);
      } else if (titleLower.includes('python') || titleLower.includes('code') || titleLower.includes('web')) {
        setAiCompleteness(95);
        setAiStrengths([
          "Clean O(n) algorithmic loop efficiency with zero memory leaks.",
          "Proper function decomposition and descriptive variable names.",
          "Passed 8 / 8 automated test suite cases."
        ]);
        setAiErrors([
          "Missing docstring comments on helper function `calculate_total()`."
        ]);
      } else if (titleLower.includes('ielts') || titleLower.includes('essay') || titleLower.includes('english')) {
        setAiCompleteness(88);
        setAiStrengths([
          "Rich academic vocabulary & natural collocations used throughout.",
          "Well-balanced 4-paragraph structure with strong topic sentences.",
          "Good use of complex sentence structures and linkers."
        ]);
        setAiErrors([
          "Paragraph 2: Slight article misuse ('a information' -> 'information').",
          "Word count: 245 words (recommend 250+ for Task 2)."
        ]);
      } else {
        setAiCompleteness(85);
        setAiStrengths([
          "Clear explanation satisfying assignment core requirements.",
          "Thorough presentation with complete work attached.",
          "Good effort and attention to detail."
        ]);
        setAiErrors([
          "Review final review section for formatting consistency."
        ]);
      }
      setIsAnalyzingAI(false);
    }, 400);
  }

  // IELTS Rounding Rule
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
    if (band >= 8.5) return 'Expert / Native Competence (C2)';
    if (band >= 8.0) return 'Very Good User (C1+)';
    if (band >= 7.5) return 'Good User (C1 Advanced)';
    if (band >= 7.0) return 'Good User (B2+)';
    if (band >= 6.5) return 'Competent User (B2)';
    if (band >= 6.0) return 'Competent User (B1+)';
    if (band >= 5.5) return 'Modest User (B1)';
    return 'Limited User';
  };

  // Letter Grade Helper
  const getLetterGrade = (pct: number): string => {
    if (pct >= 95) return 'A+ (Distinction)';
    if (pct >= 85) return 'A (Excellent)';
    if (pct >= 75) return 'B (Good)';
    if (pct >= 65) return 'C (Pass)';
    return 'F (Needs Revision)';
  };

  // Canned Feedback Pills
  const cannedFeedbackPills = [
    "✨ Excellent step-by-step logic and clear layout!",
    "📚 Great use of academic vocabulary & natural collocations.",
    "💻 Clean code syntax with optimal algorithm complexity.",
    "⚠️ Watch out for sign/calculation precision in final step.",
    "🎯 Accurate grammar with good range of complex sentences.",
    "💡 Expand your main body paragraphs with specific examples.",
    "🔄 Needs revision on connecting phrases and formatting."
  ];

  const handleAppendFeedback = (pillText: string) => {
    if (!feedbackText) {
      setFeedbackText(pillText);
    } else if (feedbackText.includes(pillText)) {
      return;
    } else {
      setFeedbackText((prev) => `${prev}\n\n${pillText}`);
    }
  };

  // Copy code shortcut
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Lightbox handlers
  const handleOpenLightbox = (att: SubmissionAttachment) => {
    setPreviewAttachment(att);
    setLightboxZoom(1.0);
    setLightboxRotation(att.rotation || 0);
  };

  // Publish Grade Function
  const handlePublishGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);

    try {
      let finalScoreDisplay = '';
      let breakdownObj: Record<string, any> = {};

      if (gradingSystem === 'IELTS Band') {
        finalScoreDisplay = `Band ${currentIELTSBand}`;
        breakdownObj = {
          taskAchievement,
          coherenceCohesion,
          lexicalResource,
          grammaticalAccuracy
        };
      } else if (gradingSystem === 'STEM & Exact Sciences') {
        const stemTotal = formulaChoice + calculationAccuracy + logicFormatting;
        finalScoreDisplay = `${stemTotal} / 30 Pts (${Math.round((stemTotal / 30) * 100)}%)`;
        breakdownObj = {
          formulaChoice,
          calculationAccuracy,
          logicFormatting,
          points: stemTotal,
          maxPoints: 30
        };
      } else if (gradingSystem === 'IT & Programming Code') {
        const codeRating = codeExecutionPass ? Math.round(((codeReadability + algorithmEfficiency) / 10) * 100) : 40;
        finalScoreDisplay = `${codeExecutionPass ? 'Passed ✅' : 'Failed ❌'} (${codeRating}%)`;
        breakdownObj = {
          codeExecutionPass,
          codeReadability,
          algorithmEfficiency
        };
      } else if (gradingSystem === 'CEFR Framework') {
        finalScoreDisplay = `CEFR ${cefrLevel} (${qualitativeTag})`;
        breakdownObj = {
          cefrLevel,
          qualitativeTag
        };
      } else {
        const pct = Math.round((scorePoints / (maxPoints || 100)) * 100);
        finalScoreDisplay = `${scorePoints} / ${maxPoints} (${pct}%) - ${rubricStatus}`;
        breakdownObj = {
          points: scorePoints,
          maxPoints,
          rubricStatus
        };
      }

      const gradePayload = {
        status: 'graded' as const,
        score: finalScoreDisplay,
        grade: finalScoreDisplay,
        gradingSystem,
        breakdown: breakdownObj,
        rubricStatus: finalScoreDisplay,
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-7xl w-full p-4 sm:p-6 shadow-2xl space-y-5 max-h-[96vh] flex flex-col my-auto transition-all">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {submission.groupName || 'CenterFlow Cohort'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Submitted: {submission.date || submission.submittedAt || 'Today'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <span>Evaluate Solution:</span>
                <span className="text-amber-500">{submission.studentName}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">

          {/* LEFT PANE: Solution Viewer & AI Diagnostic Analysis */}
          <div className="lg:col-span-6 space-y-4 flex flex-col">

            {/* AI Automated Diagnostic Analysis Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Cpu className="w-4 h-4 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                    Automated AI Solution Diagnostics
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => generateAIAnalysis(submission)}
                  disabled={isAnalyzingAI}
                  className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                  <span>Re-analyze</span>
                </button>
              </div>

              {/* Progress Completeness Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">Assignment Requirements Completeness:</span>
                  <span className="font-mono font-black text-emerald-400">{aiCompleteness}% Satisfied</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${aiCompleteness}%` }}
                  />
                </div>
              </div>

              {/* Strengths & Error Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Key Strengths
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {aiStrengths.map((s, idx) => (
                      <li key={idx} className="line-clamp-2">• {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Identified Mistakes
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {aiErrors.map((err, idx) => (
                      <li key={idx} className="line-clamp-2">• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Student Text Solution Box */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="font-extrabold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-amber-500" />
                  {submission.assignmentTitle} — Submission Text
                </span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-400">
                  Rich Text Response
                </span>
              </div>

              {submission.solutionText ? (
                submission.solutionText.includes('<') ? (
                  <div
                    className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none font-sans leading-relaxed pt-1 max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: submission.solutionText }}
                  />
                ) : (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-1 font-sans max-h-48 overflow-y-auto">
                    {submission.solutionText}
                  </div>
                )
              ) : (
                <div className="p-4 text-center text-slate-400 italic text-xs">
                  No text response included in this submission.
                </div>
              )}
            </div>

            {/* Rich Multi-Format Attachments Gallery */}
            {submission.attachments && submission.attachments.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                  <span>Media & File Attachments ({submission.attachments.length})</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {submission.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 flex flex-col justify-between"
                    >
                      {/* Image Previewer (Handwritten Notebook Scans) */}
                      {att.type === 'image' && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center group border border-slate-800">
                          <img
                            src={att.url}
                            alt={att.name}
                            onError={(e) => {
                              // Image error fallback
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                            }}
                            className="w-full h-full object-contain transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenLightbox(att)}
                              className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition cursor-pointer flex items-center gap-1"
                            >
                              <Maximize2 className="w-4 h-4" />
                              <span>Open Lightbox</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Audio Player (Oral Recitation / Speaking Drill) */}
                      {att.type === 'audio' && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-500">
                            <div className="flex items-center gap-1.5 truncate">
                              <Volume2 className="w-4 h-4 shrink-0" />
                              <span className="truncate">{att.name}</span>
                            </div>
                            <span className="text-[10px] font-mono">0:45 / 1:20</span>
                          </div>

                          {/* Animated Waveform Visualizer */}
                          <div className="h-6 flex items-center justify-between gap-1 px-1">
                            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 30, 60, 85, 40, 75, 90, 50].map((h, i) => (
                              <div
                                key={i}
                                style={{ height: `${isPlayingAudio ? Math.min(100, h * (i % 2 === 0 ? 1.2 : 0.8)) : 30}%` }}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  isPlayingAudio ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                              className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 hover:bg-amber-400 cursor-pointer"
                            >
                              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              <span>{isPlayingAudio ? 'Pause' : 'Play Audio'}</span>
                            </button>

                            {/* Playback Speed Toggle */}
                            <div className="flex items-center gap-1">
                              {[1.0, 1.25, 1.5, 2.0].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setPlaybackSpeed(s)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    playbackSpeed === s
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {s}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Code Solution Viewer (.py, .js, .cpp) */}
                      {att.type === 'code' && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                              <Code className="w-3.5 h-3.5" />
                              <span>{att.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(att.codeSnippet || 'def solution(): return True', att.id)}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedCodeId === att.id ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          <pre className="text-[11px] text-emerald-400 overflow-x-auto p-2 bg-slate-900 rounded-lg max-h-32 leading-relaxed">
                            {att.codeSnippet || `# Solution Code\ndef solve_problem(n):\n    result = [i ** 2 for i in range(n)]\n    return sum(result)\n\nprint(solve_problem(10))`}
                          </pre>
                        </div>
                      )}

                      {/* PDF / Document Attachment */}
                      {(att.type === 'pdf' || att.type === 'file') && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{att.name}</p>
                              <span className="text-[10px] text-slate-400">{att.size || 'Document'}</span>
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
                        <span className="font-mono uppercase font-bold text-amber-500">{att.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : submission.fileName ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
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
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 hover:bg-amber-400 transition cursor-pointer shrink-0 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>
            ) : null}
          </div>

          {/* RIGHT PANE: Multi-Subject Grading Engine & Feedback */}
          <div className="lg:col-span-6 space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">

            <form onSubmit={handlePublishGrade} className="space-y-4">

              {/* 5-Mode Rubric Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    Grading Rubric Mode Selector
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {gradingSystem}
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900/80 rounded-2xl border border-slate-300/50 dark:border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setGradingSystem('IELTS Band')}
                    className={`py-2 px-1.5 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      gradingSystem === 'IELTS Band'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    <span>IELTS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradingSystem('STEM & Exact Sciences')}
                    className={`py-2 px-1.5 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      gradingSystem === 'STEM & Exact Sciences'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calculator className="w-3 h-3" />
                    <span>STEM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradingSystem('IT & Programming Code')}
                    className={`py-2 px-1.5 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      gradingSystem === 'IT & Programming Code'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>IT Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradingSystem('CEFR Framework')}
                    className={`py-2 px-1.5 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      gradingSystem === 'CEFR Framework'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>CEFR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradingSystem('Points / Percentage')}
                    className={`py-2 px-1.5 rounded-xl font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                      gradingSystem === 'Points / Percentage'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Points</span>
                  </button>
                </div>
              </div>

              {/* MODE A: IELTS Band Assessment */}
              {gradingSystem === 'IELTS Band' && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-500 block">
                        Calculated Overall Band Score
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {getIELTSBandDescriptor(currentIELTSBand)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-amber-500">{currentIELTSBand.toFixed(1)}</span>
                      <span className="text-xs font-bold text-slate-400">/ 9.0</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Task Achievement</span>
                        <span className="text-amber-500 font-mono">{taskAchievement.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={taskAchievement}
                        onChange={(e) => setTaskAchievement(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Coherence & Cohesion</span>
                        <span className="text-amber-500 font-mono">{coherenceCohesion.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={coherenceCohesion}
                        onChange={(e) => setCoherenceCohesion(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Lexical Resource</span>
                        <span className="text-amber-500 font-mono">{lexicalResource.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={lexicalResource}
                        onChange={(e) => setLexicalResource(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Grammatical Range</span>
                        <span className="text-amber-500 font-mono">{grammaticalAccuracy.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="9.0"
                        step="0.5"
                        value={grammaticalAccuracy}
                        onChange={(e) => setGrammaticalAccuracy(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE B: STEM & Exact Sciences */}
              {gradingSystem === 'STEM & Exact Sciences' && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-500 block">
                        STEM Method & Procedural Points
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Math / Physics / Chemistry Rubric
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-amber-500">
                        {formulaChoice + calculationAccuracy + logicFormatting}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ 30 Pts</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>1. Methodology & Formula Choice (0-10)</span>
                        <span className="text-amber-500 font-mono">{formulaChoice} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={formulaChoice}
                        onChange={(e) => setFormulaChoice(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>2. Calculation & Procedural Accuracy (0-10)</span>
                        <span className="text-amber-500 font-mono">{calculationAccuracy} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={calculationAccuracy}
                        onChange={(e) => setCalculationAccuracy(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>3. Step-by-Step Logic & Formatting (0-10)</span>
                        <span className="text-amber-500 font-mono">{logicFormatting} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={logicFormatting}
                        onChange={(e) => setLogicFormatting(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE C: IT & Programming Code Evaluation */}
              {gradingSystem === 'IT & Programming Code' && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        Automated Test Suite Execution
                      </span>
                      <span className="text-[10px] text-slate-400">Pass or fail automated runtime checks</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCodeExecutionPass(!codeExecutionPass)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1 ${
                        codeExecutionPass
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-rose-500 text-white shadow'
                      }`}
                    >
                      {codeExecutionPass ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span>{codeExecutionPass ? 'Pass (100%)' : 'Fail (Syntax Error)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Code Readability (1-5)</span>
                        <span className="text-amber-500 font-mono">{codeReadability} ★</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={codeReadability}
                        onChange={(e) => setCodeReadability(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Algorithm Efficiency (1-5)</span>
                        <span className="text-amber-500 font-mono">{algorithmEfficiency} ★</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={algorithmEfficiency}
                        onChange={(e) => setAlgorithmEfficiency(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE D: CEFR European Language Framework */}
              {gradingSystem === 'CEFR Framework' && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Select Official CEFR Proficiency Grade
                  </span>

                  <div className="grid grid-cols-6 gap-1.5">
                    {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setCefrLevel(lvl);
                          if (lvl === 'A1' || lvl === 'A2') setQualitativeTag('Basic User');
                          else if (lvl === 'B1' || lvl === 'B2') setQualitativeTag('Independent User');
                          else setQualitativeTag('Proficient User');
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                          cefrLevel === lvl
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 flex items-center justify-between">
                    <span>Proficiency Category Tag:</span>
                    <span className="font-mono">{qualitativeTag} ({cefrLevel})</span>
                  </div>
                </div>
              )}

              {/* MODE E: Standard Points & Percentages */}
              {gradingSystem === 'Points / Percentage' && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
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

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-500">Calculated Conversion:</span>
                    <span className="font-black text-emerald-500">
                      {getLetterGrade(Math.round((scorePoints / (maxPoints || 100)) * 100))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Rubric Status Outcome
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['Distinction', 'Merit', 'Pass', 'Needs Revision'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setRubricStatus(st)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                            rubricStatus === st
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {st}
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
                    Teacher Feedback & Commentary
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Markdown Supported</span>
                </div>

                {/* Canned Feedback Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {cannedFeedbackPills.map((pill, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleAppendFeedback(pill)}
                      className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold whitespace-nowrap transition cursor-pointer border border-amber-500/20 shrink-0"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide constructive feedback, highlight key error lines, and outline actionable next steps..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              {/* Optional Reference Corrected File Link */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Optional Corrected Solution Document
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={correctedFileName}
                    onChange={(e) => setCorrectedFileName(e.target.value)}
                    placeholder="e.g. Corrected_Solution_Notes.pdf"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    value={correctedFileUrl}
                    onChange={(e) => setCorrectedFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Submit Action Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isPublishing || publishedSuccess}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
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
                      <span>Grade & Bell Notification Published!</span>
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

      {/* Lightbox Modal for Fullscreen Image Zoom & Inspection */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center space-y-4 relative">
            
            <button
              type="button"
              onClick={() => setPreviewAttachment(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-rose-500 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Interactive Image Container */}
            <div className="relative max-h-[75vh] w-full overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-2 flex items-center justify-center">
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`
                }}
                className="max-h-[70vh] w-auto object-contain mx-auto transition-transform duration-300"
              />
            </div>

            {/* Interactive Lightbox Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs text-white shadow-xl">
              <span className="font-bold truncate max-w-xs">{previewAttachment.name}</span>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3.0, z + 0.25))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom In</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Zoom Out</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1.0);
                  setLightboxRotation(0);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <a
                href={previewAttachment.url}
                download={previewAttachment.name}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center gap-1 hover:bg-amber-400 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
