import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  FileText,
  Download,
  Sparkles,
  Send,
  MessageSquare,
  Zap,
  Maximize2,
  Code,
  Check,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Cpu,
  BookOpen,
  Calculator,
  RefreshCw,
  FileCheck,
  Percent,
  Layers,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { HomeworkSubmission, SubmissionAttachment } from '../../types';
import { gradeHomeworkSubmission } from '../../services/firestore';
import { ImageScanLightbox, AudioDrillPlayer } from '../student/StudentCRMProfile';
import { generateInsaneAIResponse, roundToIELTSBand } from '../../services/gemini';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export type SubjectTrack = 'stem' | 'it' | 'sat' | 'cefr' | 'ielts' | 'general';

export interface AIDiagnostics {
  strengths: string[];
  errors: string[];
  completenessScore: number;
  trendIndicator: string;
}

interface TeacherEvaluationResponseProps {
  isOpen: boolean;
  onClose: () => void;
  submission: HomeworkSubmission | null;
  onGradeSubmitted?: (submissionId: string, updatedData: any) => void;
  teacherId?: string;
  teacherName?: string;
}

export const TeacherEvaluationResponse: React.FC<TeacherEvaluationResponseProps> = ({
  isOpen,
  onClose,
  submission,
  onGradeSubmitted,
  teacherId = 'teacher_01',
  teacherName = 'Mr. Javohirbek'
}) => {
  // Active Subject Track
  const [selectedSubject, setSelectedSubject] = useState<SubjectTrack>('stem');

  // STEM / Exact Sciences (0-10)
  const [formulaChoice, setFormulaChoice] = useState<number>(9);
  const [calculationAccuracy, setCalculationAccuracy] = useState<number>(8);
  const [logicFormatting, setLogicFormatting] = useState<number>(9);

  // IT / Code Evaluation
  const [codeExecutionPass, setCodeExecutionPass] = useState<boolean>(true);
  const [codeReadability, setCodeReadability] = useState<number>(4); // 1-5
  const [algorithmEfficiency, setAlgorithmEfficiency] = useState<number>(5); // 1-5
  const [executionNotes, setExecutionNotes] = useState<string>('');

  // SAT / General / Percentage (0-100%)
  const [percentageScore, setPercentageScore] = useState<number>(88);
  const [letterGrade, setLetterGrade] = useState<string>('A');
  const [rubricStatus, setRubricStatus] = useState<'Distinction' | 'Merit' | 'Pass' | 'Needs Revision'>('Distinction');

  // CEFR Framework
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B2');
  const [cefrDescriptor, setCefrDescriptor] = useState<string>('Vantage / Upper Intermediate');

  // IELTS Band
  const [taskAchievement, setTaskAchievement] = useState<number>(7.0);
  const [coherenceCohesion, setCoherenceCohesion] = useState<number>(7.5);
  const [lexicalResource, setLexicalResource] = useState<number>(7.0);
  const [grammaticalAccuracy, setGrammaticalAccuracy] = useState<number>(7.0);

  // AI Diagnostics State
  const [aiDiagnostics, setAiDiagnostics] = useState<AIDiagnostics>({
    strengths: [
      'Accurate mathematical formulas applied in problem solving',
      'Clean step-by-step logical breakdown and clear working'
    ],
    errors: [
      'Slight calculation slip on line 4 of algebraic reduction',
      'Ensure units are explicitly stated in final answer'
    ],
    completenessScore: 92,
    trendIndicator: '+8% vs Class Average (Consistent High Mastery)'
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // Teacher Feedback & File Correction
  const [commentaryText, setCommentaryText] = useState<string>('');
  const [correctedFileName, setCorrectedFileName] = useState<string>('');
  const [correctedSolutionUrl, setCorrectedSolutionUrl] = useState<string>('');

  // UI States
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; imageSrc: string; title: string }>({
    isOpen: false,
    imageSrc: '',
    title: ''
  });

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load state when submission changes
  useEffect(() => {
    if (submission) {
      if (submission.feedback) setCommentaryText(submission.feedback);
      if (submission.correctedFileName) setCorrectedFileName(submission.correctedFileName);
      if (submission.correctedFileUrl) setCorrectedSolutionUrl(submission.correctedFileUrl);

      // Map grading system to subject track
      const sys = (submission.gradingSystem || '').toLowerCase();
      if (sys.includes('stem') || sys.includes('math') || sys.includes('physics')) {
        setSelectedSubject('stem');
      } else if (sys.includes('it') || sys.includes('code') || sys.includes('prog')) {
        setSelectedSubject('it');
      } else if (sys.includes('cefr')) {
        setSelectedSubject('cefr');
      } else if (sys.includes('ielts')) {
        setSelectedSubject('ielts');
      } else if (sys.includes('sat')) {
        setSelectedSubject('sat');
      } else {
        setSelectedSubject('stem');
      }

      // Load sub-scores if existing
      if (submission.breakdown) {
        const b = submission.breakdown;
        if (b.formulaChoice !== undefined) setFormulaChoice(b.formulaChoice);
        if (b.calculationAccuracy !== undefined) setCalculationAccuracy(b.calculationAccuracy);
        if (b.logicFormatting !== undefined) setLogicFormatting(b.logicFormatting);
        if (b.codeExecutionPass !== undefined) setCodeExecutionPass(b.codeExecutionPass);
        if (b.codeReadability !== undefined) setCodeReadability(b.codeReadability);
        if (b.algorithmEfficiency !== undefined) setAlgorithmEfficiency(b.algorithmEfficiency);
        if (b.cefrLevel) setCefrLevel(b.cefrLevel as any);
        if (b.taskAchievement !== undefined) setTaskAchievement(b.taskAchievement);
        if (b.coherenceCohesion !== undefined) setCoherenceCohesion(b.coherenceCohesion);
        if (b.lexicalResource !== undefined) setLexicalResource(b.lexicalResource);
        if (b.grammaticalAccuracy !== undefined) setGrammaticalAccuracy(b.grammaticalAccuracy);
        if (b.points !== undefined) setPercentageScore(b.points);
      }

      // Auto-trigger AI Analysis
      triggerAIDiagnostics(submission);
    }
  }, [submission]);

  // Automatic Letter Grade & Status derived from percentage
  useEffect(() => {
    if (percentageScore >= 90) {
      setLetterGrade('A+');
      setRubricStatus('Distinction');
    } else if (percentageScore >= 80) {
      setLetterGrade('A');
      setRubricStatus('Distinction');
    } else if (percentageScore >= 70) {
      setLetterGrade('B');
      setRubricStatus('Merit');
    } else if (percentageScore >= 60) {
      setLetterGrade('C');
      setRubricStatus('Pass');
    } else {
      setLetterGrade('F');
      setRubricStatus('Needs Revision');
    }
  }, [percentageScore]);

  if (!isOpen || !submission) return null;

  // Calculate Overall Score Strings
  const getCalculatedScoreDetails = () => {
    switch (selectedSubject) {
      case 'stem': {
        const totalPoints = formulaChoice + calculationAccuracy + logicFormatting;
        const percentage = Math.round((totalPoints / 30) * 100);
        return {
          displayScore: `${totalPoints} / 30 (${percentage}%)`,
          percentage,
          systemName: 'STEM & Exact Sciences',
          breakdown: {
            formulaChoice,
            calculationAccuracy,
            logicFormatting,
            totalPoints,
            maxPoints: 30,
            percentage
          }
        };
      }
      case 'it': {
        const qualityScore = (codeReadability + algorithmEfficiency) * 10;
        const passBonus = codeExecutionPass ? 50 : 10;
        const percentage = Math.min(100, qualityScore + passBonus);
        const passText = codeExecutionPass ? 'PASS ✅' : 'FAIL ❌';
        return {
          displayScore: `${passText} — ${percentage}%`,
          percentage,
          systemName: 'IT & Programming Code',
          breakdown: {
            codeExecutionPass,
            codeReadability,
            algorithmEfficiency,
            executionNotes,
            percentage
          }
        };
      }
      case 'sat':
      case 'general': {
        return {
          displayScore: `${percentageScore}% (${letterGrade} - ${rubricStatus})`,
          percentage: percentageScore,
          systemName: 'SAT & Standard Point Scale',
          breakdown: {
            points: percentageScore,
            maxPoints: 100,
            letterGrade,
            rubricStatus
          }
        };
      }
      case 'cefr': {
        const cefrPercentages: Record<string, number> = {
          A1: 45,
          A2: 55,
          B1: 68,
          B2: 82,
          C1: 92,
          C2: 98
        };
        const pct = cefrPercentages[cefrLevel] || 80;
        return {
          displayScore: `CEFR ${cefrLevel} (${cefrDescriptor})`,
          percentage: pct,
          systemName: 'CEFR Framework',
          breakdown: {
            cefrLevel,
            cefrDescriptor,
            percentage: pct
          }
        };
      }
      case 'ielts': {
        const rawAvg = (taskAchievement + coherenceCohesion + lexicalResource + grammaticalAccuracy) / 4;
        const overallBand = roundToIELTSBand(rawAvg);
        const percentage = Math.round((overallBand / 9) * 100);
        return {
          displayScore: `Band ${overallBand.toFixed(1)}`,
          percentage,
          systemName: 'IELTS Band Scale',
          breakdown: {
            taskAchievement,
            coherenceCohesion,
            lexicalResource,
            grammaticalAccuracy,
            overallBand,
            percentage
          }
        };
      }
    }
  };

  // AI Diagnostic Generator
  const triggerAIDiagnostics = async (sub: HomeworkSubmission) => {
    setIsGeneratingAI(true);
    try {
      const promptText = `
Analyze this student solution and generate diagnostic evaluation feedback.
Assignment: "${sub.assignmentTitle}"
Subject Track: "${selectedSubject}"
Student Answer: "${sub.solutionText || 'Provided attached file submission.'}"

Generate JSON response with:
1. "strengths": 2 bullet points highlighting correct formulas, clean logic, or strong vocabulary
2. "errors": 2 bullet points detailing specific calculation mistakes, missing cases, or grammar flaws
3. "completenessScore": integer 0-100 indicating percentage of prompt answered
4. "trendIndicator": short string like "+10% vs Class Average (High Mastery)"

Respond strictly in raw valid JSON format without markdown code fences.
`;

      const aiRes = await generateInsaneAIResponse({
        prompt: promptText,
        role: 'teacher',
        customSystemInstruction: 'You are an AI diagnostic grading engine. Return raw valid JSON.'
      });

      if (aiRes && aiRes.text) {
        try {
          const cleanedText = aiRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedText);
          if (parsed.strengths && parsed.errors) {
            setAiDiagnostics({
              strengths: parsed.strengths,
              errors: parsed.errors,
              completenessScore: parsed.completenessScore || 88,
              trendIndicator: parsed.trendIndicator || 'Consistent High Performance'
            });
          }
        } catch (pErr) {
          console.warn('AI Diagnostic JSON parse fallback:', pErr);
        }
      }
    } catch (err) {
      console.warn('AI Diagnostics notice:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Quick Tags inserting into feedback commentary
  const insertQuickTag = (tag: string) => {
    setCommentaryText((prev) => (prev ? `${prev}\n${tag}` : tag));
  };

  // Save & Dispatch Notification
  const handlePublishGrade = async () => {
    setIsPublishing(true);
    try {
      const scoreObj = getCalculatedScoreDetails();

      const gradePayload = {
        status: 'graded' as const,
        score: scoreObj.displayScore,
        grade: scoreObj.displayScore,
        gradingSystem: scoreObj.systemName,
        breakdown: scoreObj.breakdown,
        rubricStatus: rubricStatus,
        feedback: commentaryText || 'Great effort! Review the detailed rubric breakdown and notes.',
        teacherName: teacherName,
        studentId: submission.studentId,
        studentName: submission.studentName,
        assignmentTitle: submission.assignmentTitle,
        correctedFileName: correctedFileName || undefined,
        correctedFileUrl: correctedSolutionUrl || undefined,
        aiDiagnostics: aiDiagnostics
      };

      // 1. Direct write to Firestore via helper
      const success = await gradeHomeworkSubmission(submission.id, gradePayload);

      // 2. Direct write update to document
      if (submission.id && !submission.id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'homework_submissions', submission.id), {
            status: 'graded',
            gradedAt: serverTimestamp(),
            gradedBy: teacherName,
            subjectTrack: selectedSubject,
            evaluation: {
              finalDisplayScore: scoreObj.displayScore,
              numericPercentage: scoreObj.percentage,
              rubricDetails: scoreObj.breakdown
            },
            teacherFeedback: commentaryText,
            correctedSolutionUrl: correctedSolutionUrl || null,
            aiDiagnostics: aiDiagnostics
          });

          // 🔔 Dispatch Notification directly to Firestore
          await addDoc(collection(db, 'notifications'), {
            title: `Solution Evaluated: ${submission.assignmentTitle}`,
            message: `Your work in [${selectedSubject.toUpperCase()}] was graded. Result: ${scoreObj.displayScore}`,
            type: 'grade_published',
            category: 'grade_published',
            recipientId: submission.studentId,
            recipientRole: 'student',
            linkId: submission.id,
            isRead: false,
            createdAt: serverTimestamp()
          });
        } catch (fsErr) {
          console.warn('Firestore direct write notice:', fsErr);
        }
      }

      if (onGradeSubmitted) {
        onGradeSubmitted(submission.id, gradePayload);
      }

      onClose();
    } catch (err) {
      console.error('Error publishing grade:', err);
    } finally {
      setIsPublishing(false);
    }
  };

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
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <ImageScanLightbox
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
        imageSrc={lightbox.imageSrc}
        title={lightbox.title}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-7xl w-full p-4 sm:p-6 shadow-2xl space-y-5 max-h-[96vh] flex flex-col my-auto transition-all"
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
                  Universal Solution Evaluator
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {submission.studentName} • {submission.assignmentTitle}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                Teacher Evaluation & Grade Response Engine
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

        {/* Modal Body - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto pr-1">
          {/* Left Column: Submitted Materials & Media Viewer (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Student Solution Submission</span>
                <span className="text-[10px] text-amber-500 font-mono">{submission.date}</span>
              </h3>

              {/* Text / Code Answer */}
              {submission.solutionText ? (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {submission.solutionText}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No text solution content included.</p>
              )}

              {/* Attachments */}
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Media Attachments ({submission.attachments.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {submission.attachments.map((att, idx) => {
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
                            className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video group cursor-pointer bg-slate-950"
                          >
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2 text-white text-xs font-bold gap-1">
                              <Maximize2 className="w-4 h-4" />
                              <span>Inspect Scanned Worksheet</span>
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
                        <div key={att.id || idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                            {att.name}
                          </span>
                          <a href={att.url} target="_blank" rel="noreferrer" className="p-1 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* AI Solution Diagnostics Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">AI Solution Diagnostic Summary</h4>
                </div>
                <button
                  onClick={() => triggerAIDiagnostics(submission)}
                  disabled={isGeneratingAI}
                  className="p-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>Re-analyze</span>
                </button>
              </div>

              {/* Strengths */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Key Strengths
                </span>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-3 list-disc">
                  {aiDiagnostics.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Errors */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Identified Mistakes & Misconceptions
                </span>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-3 list-disc">
                  {aiDiagnostics.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>

              {/* Completeness Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Prompt Completeness Score</span>
                  <span className="text-amber-500 font-mono">{aiDiagnostics.completenessScore}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${aiDiagnostics.completenessScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Subject Evaluation Rubric & Feedback (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Subject Track Switcher Tabs */}
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 grid grid-cols-5 gap-1 text-center text-xs font-bold">
              {[
                { key: 'stem', label: 'STEM / Math', icon: Calculator },
                { key: 'it', label: 'IT / Code', icon: Code },
                { key: 'sat', label: 'SAT / Points', icon: Percent },
                { key: 'cefr', label: 'CEFR', icon: Layers },
                { key: 'ielts', label: 'IELTS Band', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedSubject === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedSubject(tab.key as SubjectTrack)}
                    className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Track 1: STEM & Exact Sciences */}
            {selectedSubject === 'stem' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Exact Sciences Scoring Breakdown (0 - 10)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Methodology & Formulas
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formulaChoice}
                      onChange={(e) => setFormulaChoice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Calculation Accuracy
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={calculationAccuracy}
                      onChange={(e) => setCalculationAccuracy(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Logic & Presentation
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={logicFormatting}
                      onChange={(e) => setLogicFormatting(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Track 2: IT & Programming Code */}
            {selectedSubject === 'it' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-cyan-500 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Code Quality & Execution Evaluation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Code Execution
                    </label>
                    <button
                      type="button"
                      onClick={() => setCodeExecutionPass(!codeExecutionPass)}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                        codeExecutionPass
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      }`}
                    >
                      {codeExecutionPass ? 'PASS ✅' : 'FAIL ❌'}
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Readability (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={codeReadability}
                      onChange={(e) => setCodeReadability(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Efficiency (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={algorithmEfficiency}
                      onChange={(e) => setAlgorithmEfficiency(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Track 3: SAT / General Percentage */}
            {(selectedSubject === 'sat' || selectedSubject === 'general') && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-emerald-500 flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Numerical Percentage & Letter Grade Scale
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Percentage Score (0 - 100%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentageScore}
                      onChange={(e) => setPercentageScore(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-lg font-black text-amber-500"
                    />
                  </div>
                  <div className="text-center px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Letter Grade</span>
                    <span className="text-2xl font-black text-amber-500 font-mono">{letterGrade}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Track 4: CEFR */}
            {selectedSubject === 'cefr' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-500 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> CEFR Language Framework Level
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCefrLevel(lvl)}
                      className={`py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                        cefrLevel === lvl
                          ? 'bg-indigo-500 text-white shadow-md'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Track 5: IELTS Band */}
            {selectedSubject === 'ielts' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
                  <Award className="w-4 h-4" /> IELTS Official Skill Descriptors (1.0 - 9.0)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Task Response', val: taskAchievement, setVal: setTaskAchievement },
                    { label: 'Coherence', val: coherenceCohesion, setVal: setCoherenceCohesion },
                    { label: 'Lexical', val: lexicalResource, setVal: setLexicalResource },
                    { label: 'Grammar', val: grammaticalAccuracy, setVal: setGrammaticalAccuracy }
                  ].map((s) => (
                    <div key={s.label}>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">{s.label}</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1.0"
                        max="9.0"
                        value={s.val}
                        onChange={(e) => s.setVal(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-amber-500 text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Commentary & Quick Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  Teacher Commentary & Markdown Notes
                </label>
              </div>

              {/* Quick Tag Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  '⚡ Excellent step-by-step logic!',
                  '⚠️ Watch out for calculation mistakes',
                  '📚 Great lexical variety & vocabulary',
                  '💡 Well structured proof!'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertQuickTag(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={commentaryText}
                onChange={(e) => setCommentaryText(e.target.value)}
                placeholder="Write detailed teacher commentary, recommendations, or step-by-step guidance..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Corrected File Attachment Link */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Attach Corrected PDF / Solution Link
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={correctedFileName}
                  onChange={(e) => setCorrectedFileName(e.target.value)}
                  placeholder="File Name (e.g. Solution_Annotated.pdf)"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />
                <input
                  type="url"
                  value={correctedSolutionUrl}
                  onChange={(e) => setCorrectedSolutionUrl(e.target.value)}
                  placeholder="URL (e.g. https://storage...)"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handlePublishGrade}
              disabled={isPublishing}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isPublishing ? 'Publishing Grade & Syncing Real-Time...' : 'Publish Grade & Dispatch Notification'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
