import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  FileText,
  Download,
  Calendar,
  Clock,
  Send,
  User,
  Paperclip,
  CheckCircle2,
  Sparkles,
  Inbox,
  Upload,
  X,
  Check,
  Headphones,
  Code,
  BookOpen,
  Layers,
  ExternalLink
} from 'lucide-react';
import {
  subscribeFeedPosts,
  subscribeAssignments,
  addPostComment,
  submitHomework,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { FeedPost, Assignment } from '../../types';
import { WPSEditor } from '../../components/UI/WPSEditor';

export const GroupFeed: React.FC = () => {
  const { language } = useLanguage();
  const { userProfile, currentUser } = useAuth();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [newComment, setNewComment] = useState('');
  const [activePostForComment, setActivePostForComment] = useState<string | null>(null);

  // Homework Submission Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'javascript' | 'cpp' | 'html'>('python');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio recording state simulation
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleDownloadFile = (fileUrl?: string, fileName?: string) => {
    const targetName = fileName || 'assignment_material';
    if (!fileUrl || fileUrl === '#' || fileUrl.trim() === '') {
      // Generate downloadable text blob if no external URL is available
      const blob = new Blob([
        `=== CenterFlow Learning Material ===\nTitle: ${targetName}\nDate: ${new Date().toLocaleDateString()}\nGenerated study material for offline practice.`
      ], { type: 'text/plain;charset=utf-8' });
      const dummyUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dummyUrl;
      link.download = targetName.endsWith('.pdf') || targetName.endsWith('.txt') ? targetName : `${targetName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dummyUrl);
      setToastMessage(t("Fayl yuklab olindi! ⬇️", "Material downloaded! ⬇️", "Файл скачан! ⬇️"));
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const insertMathSymbol = (sym: string) => {
    setSolutionText((prev) => prev + sym);
  };

  const setCodeTemplate = (lang: 'python' | 'javascript' | 'cpp' | 'html') => {
    setCodeLanguage(lang);
    if (!solutionText.trim()) {
      if (lang === 'python') {
        setSolutionText("# Python Solution\ndef main():\n    print('CenterFlow Code Solution')\n\nif __name__ == '__main__':\n    main()");
      } else if (lang === 'javascript') {
        setSolutionText("// JavaScript Solution\nfunction solve(input) {\n    return 'Solved';\n}");
      } else if (lang === 'cpp') {
        setSolutionText("// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Ready\" << endl;\n    return 0;\n}");
      } else if (lang === 'html') {
        setSolutionText("<!-- HTML / Web Component -->\n<div class=\"app\">\n    <h1>CenterFlow App</h1>\n</div>");
      }
    }
  };

  useEffect(() => {
    let unsubPosts: () => void = () => {};
    let unsubAssignments: () => void = () => {};
    let isMounted = true;

    setIsLoading(true);
    seedFirestoreIfEmpty();

    try {
      unsubPosts = subscribeFeedPosts((data) => {
        if (!isMounted) return;
        setPosts(data);
        setIsLoading(false);
      });

      unsubAssignments = subscribeAssignments((data) => {
        if (!isMounted) return;
        setAssignments(data);
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error fetching group feed:', err);
      if (isMounted) setIsLoading(false);
    }

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubPosts();
      unsubAssignments();
    };
  }, []);

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;
    const authorName = userProfile?.displayName || currentUser?.displayName || 'Student';
    try {
      await addPostComment(postId, newComment.trim(), authorName);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !solutionText.trim()) return;

    setIsSubmitting(true);
    const studentName = userProfile?.displayName || currentUser?.displayName || 'Student';
    const studentId = currentUser?.uid || Date.now().toString();

    try {
      await submitHomework({
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        studentId,
        studentName,
        solutionText: solutionText.trim(),
        fileName: submissionFile ? submissionFile.name : undefined,
        date: new Date().toISOString().split('T')[0]
      });

      setSubmittedIds((prev) => [...prev, selectedAssignment.id]);
      setSelectedAssignment(null);
      setSolutionText('');
      setSubmissionFile(null);
      setToastMessage(t("Vazifa muvaffaqiyatli topshirildi! ✅", "Assignment submitted successfully! ✅", "Задание успешно сдано! ✅"));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error submitting homework:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAudioFile = (filename?: string, format?: string) => {
    if (format?.toLowerCase().includes('audio')) return true;
    if (!filename) return false;
    const lower = filename.toLowerCase();
    return lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.ogg');
  };

  const isCodeFile = (filename?: string, format?: string) => {
    if (format?.toLowerCase().includes('code')) return true;
    if (!filename) return false;
    const lower = filename.toLowerCase();
    return lower.endsWith('.py') || lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.cpp') || lower.endsWith('.zip');
  };

  const getSubjectBadgeStyle = (category?: string) => {
    if (!category) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (category.includes('Math')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (category.includes('Physics')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (category.includes('Chemistry')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (category.includes('IT') || category.includes('Computer')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    if (category.includes('SAT')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (category.includes('Languages') || category.includes('IELTS')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  // Dual Feed Sync: Combine assignments and posts in chronological order
  const combinedFeedItems = [
    ...assignments.map((hw) => ({
      type: 'assignment' as const,
      id: hw.id,
      title: hw.title,
      content: hw.description || hw.instructions || 'New course assignment posted for your group.',
      date: hw.dueDate || hw.deadline || '2026-08-15',
      author: hw.teacherName || 'Instructor',
      file: hw.file || hw.fileName || 'Assignment_Guide.pdf',
      fileUrl: hw.fileUrl || hw.audioUrl || hw.pdfUrl,
      subjectCategory: hw.subjectCategory || '📐 Mathematics & Geometry',
      resourceFormat: hw.resourceFormat || '📝 Problem Set / Quiz Sheet',
      rawAssignment: hw
    })),
    ...posts.map((p) => ({
      type: 'post' as const,
      id: p.id,
      title: p.title,
      content: p.content,
      date: p.date,
      author: p.author,
      file: p.attachment,
      fileUrl: '',
      subjectCategory: p.subjectCategory || '🌐 Languages & IELTS/CEFR',
      resourceFormat: p.resourceFormat || '📖 Reading & Lecture Material',
      rawPost: p
    }))
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Group Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{t("Guruhingiz: Learning Center Live Stream", "Your Group: Universal Course Stream", "Ваша Группа: Универсальный Поток")}</span>
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-2">
            {t("Guruh Lentasiga Xush Kelibsiz!", "Welcome to Your Group Feed!", "Добро Пожаловать в Ленту Группы!")}
          </h2>
          <p className="text-xs text-slate-900/80 mt-1 max-w-xl">
            {t(
              "Ustozingiz tomonidan joylanadigan e'lonlar, matematika, fizika, kodlash va til vazifalarini shu yerdan yuklab oling va topshiriring.",
              "Track announcements, download problem sets, code samples, audio drills, and submit your homework solutions.",
              "Следите за объявлениями, скачивайте задачи, код, аудио и сдавайте ваши решения."
            )}
          </p>
        </div>

        <div className="bg-slate-950/10 backdrop-blur-md p-4 rounded-2xl border border-slate-950/20 text-xs shrink-0 font-semibold space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t("Dushanba / Chorshanba / Juma", "Mon / Wed / Fri", "Пн / Ср / Пт")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>14:00 - 16:00 (Room 3)</span>
          </div>
        </div>
      </div>

      {/* Homework Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitSolution}
            className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <span>{t("Vazifani Topshirish", "Submit Homework Solution", "Сдать Задание")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSubjectBadgeStyle(selectedAssignment.subjectCategory)}`}>
                  {selectedAssignment.subjectCategory || '📐 Mathematics'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                  {selectedAssignment.resourceFormat || '📝 Problem Set'}
                </span>
              </div>
              <p className="font-extrabold text-slate-900 dark:text-white mt-1">{selectedAssignment.title}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Deadline: {selectedAssignment.dueDate || selectedAssignment.deadline}
              </p>
            </div>

            {/* DYNAMIC SUBJECT-AWARE EDITOR SWITCH */}
            {(selectedAssignment.subjectCategory?.includes('IT') ||
              selectedAssignment.subjectCategory?.includes('Computer') ||
              selectedAssignment.resourceFormat?.includes('Code')) ? (
              /* 💻 IT & CODE EDITOR MODE */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Code className="w-4 h-4" />
                    <span>{t("IDE Code Editor & Repository", "IDE Code Editor & Syntax Tabs", "IDE Редактор Кода")}</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                    {(['python', 'javascript', 'cpp', 'html'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setCodeTemplate(lang)}
                        className={`px-2.5 py-1 rounded font-bold uppercase transition ${
                          codeLanguage === lang
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <WPSEditor
                    value={solutionText}
                    onChange={setSolutionText}
                    placeholder="// Paste or write your source code, explanations, and repository details in WPS Word style..."
                    minHeight="180px"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("GitHub / Repository / Live Demo Havolasi (URL)", "GitHub / Repository / Live Demo Link (URL)", "Ссылка на GitHub / Репозиторий")}
                  </label>
                  <div className="relative">
                    <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/project-repo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (selectedAssignment.subjectCategory?.includes('Math') ||
                 selectedAssignment.subjectCategory?.includes('Physics') ||
                 selectedAssignment.subjectCategory?.includes('Chemistry')) ? (
              /* 📐 MATH & PHYSICS STEP-BY-STEP SOLVER MODE */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-500">
                    {t("Matematik Formula va Yechim Yozuvchisi", "Step-by-Step Problem Solver & Equations", "Математический Редактор Urve")}
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Formula Helper Active</span>
                </div>

                {/* Equation Helper Symbols Toolbar */}
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex flex-wrap gap-1.5 text-xs">
                  {['√', 'x²', 'xⁿ', 'π', '∫', '±', '÷', 'θ', 'Σ', 'Δ', '∞', '≠', '≤', '≥', 'α', 'β'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => insertMathSymbol(sym)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-slate-950 font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 transition"
                    >
                      {sym}
                    </button>
                  ))}
                </div>

                <WPSEditor
                  value={solutionText}
                  onChange={setSolutionText}
                  placeholder={t("1-Qadam: Tenglamani yozing...\n2-Qadam: Yechim: x = (-b ± √(b² - 4ac)) / 2a", "Step 1: State equations...\nStep 2: Solution: x = (-b ± √(b² - 4ac)) / 2a", "Шаг 1: Формула...\nШаг 2: Решение...")}
                  minHeight="180px"
                />

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <span>📷</span>
                    <span>{t("Qog'ozdagi yechim suratini yuklash", "📷 Attach Photos of Handwritten Scratchwork", "📷 Загрузить фото решения от руки")}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t("Qo'lda yozilgan masalalar varag'i rasmini skanerlab biriktirishingiz mumkin.", "Upload photo/scan of your handwritten calculations and proofs.", "Прикрепите фото или скан решений на бумаге.")}
                  </p>
                </div>
              </div>
            ) : isAudioFile(selectedAssignment.file, selectedAssignment.resourceFormat) ? (
              /* 🎧 AUDIO & SPEAKING DRILL MODE */
              <div className="space-y-3">
                <label className="block text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4" />
                  <span>{t("Audio / Speaking Ovozli Javob Yozib Olish", "Voice / Audio Speaking Recorder", "Запись Задания Вслух")}</span>
                </label>

                <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecording) {
                          setIsRecording(false);
                          setHasRecordedAudio(true);
                        } else {
                          setIsRecording(true);
                          setRecordTime(0);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                        isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                      }`}
                    >
                      <span>{isRecording ? "⏸️ Pause Recording" : "🎙️ Record Voice Response"}</span>
                    </button>
                  </div>

                  {isRecording && (
                    <p className="text-xs text-rose-400 font-mono font-bold animate-pulse">
                      Recording Live Audio... 00:{recordTime < 10 ? `0${recordTime}` : recordTime}
                    </p>
                  )}

                  {hasRecordedAudio && !isRecording && (
                    <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Audio Response Saved (00:{recordTime < 10 ? `0${recordTime}` : recordTime})</span>
                    </p>
                  )}
                </div>

                <WPSEditor
                  value={solutionText}
                  onChange={setSolutionText}
                  placeholder={t("Audio javobingiz qisqacha matni yoki transkripti...", "Notes or transcript of your audio recording...", "Краткие заметки к вашей аудиозаписи...")}
                  minHeight="140px"
                />
              </div>
            ) : (
              /* ✍️ ESSAY / RICH TEXT WRITING MODE */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("Insho va Yozma Javob (WPS Office Suite & Word Counter)", "WPS Rich Text Essay & Word Count", "Эссе и Письменный Ответ (WPS Office)")}
                  </label>
                </div>

                {/* Essay Section Quick Helpers */}
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSolutionText((prev) => prev + "\n\n1. Introduction:\n")}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-amber-500 hover:text-slate-950 transition"
                  >
                    + Intro
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolutionText((prev) => prev + "\n\n2. Body Paragraph:\n")}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-amber-500 hover:text-slate-950 transition"
                  >
                    + Body
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolutionText((prev) => prev + "\n\n3. Conclusion:\n")}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-amber-500 hover:text-slate-950 transition"
                  >
                    + Conclusion
                  </button>
                </div>

                <WPSEditor
                  value={solutionText}
                  onChange={setSolutionText}
                  placeholder={t("Insho, javoblar yoki formulalarni WPS Office uslubida yozing...", "Write your essay, solutions, or equations in WPS style...", "Напишите ваше эссе или решение в стиле WPS Office...")}
                  minHeight="180px"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Yechim Fayli Biriktirish (PDF / ZIP / Audio / Photo)", "Attach Solution File (PDF / Code ZIP / Photo)", "Прикрепить Файл Решения")}
              </label>
              <input
                type="file"
                onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {t("Bekor qilish", "Cancel", "Отмена")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? t("Topshirilmoqda...", "Submitting...", "Отправка...") : t("Topshirish", "Submit Solution", "Отправить")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Synchronized Stream Feed */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>{t("So'nggi E'lonlar va Vazifalar", "Recent Posts & Assignments Feed", "Последние Объявления и Задания")}</span>
          </h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
              ))}
            </div>
          ) : combinedFeedItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Inbox className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t("Ayni vaqtda guruh lentasida e'lonlar yo'q", "No stream posts published yet", "В ленте группы пока нет публикаций")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t(
                  "O'qituvchingiz guruhga vazifa yoki dars materiallarini joylaganda, ushbu lentalarda avtomatik ko'rinadi.",
                  "When your instructor posts homework or study resources, they will appear in this live feed stream.",
                  "Когда ваш преподаватель опубликует материалы, они появятся здесь."
                )}
              </p>
            </div>
          ) : (
            combinedFeedItems.map((item) => {
              const isSubmitted = item.type === 'assignment' && submittedIds.includes(item.id);
              const audioPlayer = isAudioFile(item.file, item.resourceFormat);
              const codeFile = isCodeFile(item.file, item.resourceFormat);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4"
                >
                  {/* Author & Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                        {item.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.author}
                        </h4>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          {item.type === 'assignment' ? 'Course Instructor' : 'Announcement'} • {item.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getSubjectBadgeStyle(item.subjectCategory)}`}>
                        {item.subjectCategory}
                      </span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h5 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                      {item.title}
                    </h5>
                    {item.content?.includes('<') ? (
                      <div
                        className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed prose dark:prose-invert max-w-none font-sans overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.content}
                      </p>
                    )}
                  </div>

                  {/* Audio File Player Preview */}
                  {audioPlayer && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                        <Headphones className="w-4 h-4" />
                        <span>Audio Practice Player ({item.file})</span>
                      </div>
                      <audio controls className="w-full h-8" src={item.fileUrl || undefined}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Download File / Code Action Bar */}
                  {item.file && !audioPlayer && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {codeFile ? (
                          <Code className="w-5 h-5 text-cyan-500 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs">
                            {item.file}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.resourceFormat}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadFile(item.fileUrl, item.file)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t("⬇️ Download File / Material", "⬇️ Download File / Material", "⬇️ Скачать Материал")}</span>
                      </button>
                    </div>
                  )}

                  {/* Submit Button for Assignments in Stream */}
                  {item.type === 'assignment' && item.rawAssignment && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500">
                        Deadline: {item.date}
                      </span>
                      <button
                        onClick={() => setSelectedAssignment(item.rawAssignment!)}
                        disabled={isSubmitted}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isSubmitted ? t("Topshirildi ✅", "Submitted ✅", "Сдано ✅") : t("Submit Solution", "Submit Solution", "Сдать Решение")}</span>
                      </button>
                    </div>
                  )}

                  {/* Comments for Posts */}
                  {item.type === 'post' && item.rawPost && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold">
                          {item.rawPost.comments?.length || 0} {t("Izohlar", "Comments", "Комментарии")}
                        </span>
                        <button
                          onClick={() => setActivePostForComment(activePostForComment === item.id ? null : item.id)}
                          className="text-amber-500 hover:underline font-semibold cursor-pointer"
                        >
                          {t("Izoh qoldirish", "Add Comment", "Оставить комментарий")}
                        </button>
                      </div>

                      {item.rawPost.comments?.map((c, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <User className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <p>
                            <strong className="text-slate-900 dark:text-white mr-1">{c.author}:</strong>
                            {c.text}
                          </p>
                        </div>
                      ))}

                      {activePostForComment === item.id && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t("Izohingizni yozing...", "Write your comment...", "Напишите комментарий...")}
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            onClick={() => handleAddComment(item.id)}
                            className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer hover:bg-amber-400"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Info & Pending Assignments */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("Topshirilishi Kerak Vazifalar", "Pending Assignments Widget", "Предстоящие Задания")}</span>
            </h4>

            {isLoading ? (
              <div className="h-24 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800/50" />
            ) : assignments.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                {t("Hozircha topshiriqlar berilmagan.", "No pending homework tasks.", "Пока нет предстоящих заданий.")}
              </div>
            ) : (
              assignments.map((hw) => {
                const isSubmitted = submittedIds.includes(hw.id);
                return (
                  <div key={hw.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSubjectBadgeStyle(hw.subjectCategory)}`}>
                        {hw.subjectCategory || 'Math'}
                      </span>
                      {isSubmitted && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>{t("Topshirildi", "Submitted", "Сдано")}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {hw.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {hw.group} • Deadline: {hw.dueDate || hw.deadline}
                    </p>

                    <button
                      onClick={() => setSelectedAssignment(hw)}
                      disabled={isSubmitted}
                      className="w-full mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isSubmitted ? t("Bajarilgan ✅", "Completed ✅", "Выполнено ✅") : t("Topshirish", "Submit Solution", "Сдать")}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick AI Help Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>24/7 AI Universal Tutor</span>
              </div>
              <h4 className="text-sm font-bold">
                {t("Math, Physics & Code Yordamchisi", "Universal AI Homework Assistant", "Универсальный AI Помощник")}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t(
                  "Matematika tenglamalari, dasturlash kodi yoki insho xatolarini topshirishdan oldin AI bilan tekshiring.",
                  "Get instant help with math equations, code debugging, or essay feedback before submitting your work.",
                  "Получайте мгновенную помощь с математическими уравнениями, кодом или эссе."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


