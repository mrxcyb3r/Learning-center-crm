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
  Check
} from 'lucide-react';
import {
  subscribeFeedPosts,
  subscribeAssignments,
  addPostComment,
  submitHomework,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { DEFAULT_MOCK_POSTS, DEFAULT_MOCK_ASSIGNMENTS } from '../../data/mockData';
import { FeedPost, Assignment } from '../../types';

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
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let unsubPosts: () => void = () => {};
    let unsubAssignments: () => void = () => {};
    let isMounted = true;

    setIsLoading(true);
    seedFirestoreIfEmpty();

    try {
      unsubPosts = subscribeFeedPosts((data) => {
        if (!isMounted) return;
        setPosts(data.length > 0 ? data : DEFAULT_MOCK_POSTS);
        setIsLoading(false);
      });

      unsubAssignments = subscribeAssignments((data) => {
        if (!isMounted) return;
        setAssignments(data.length > 0 ? data : DEFAULT_MOCK_ASSIGNMENTS);
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
          <span className="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider">
            {t("Guruhingiz: IELTS Intensive #12", "Your Group: IELTS Intensive #12", "Ваша Группа: IELTS Intensive #12")}
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-2">
            {t("Guruh Lentasiga Xush Kelibsiz!", "Welcome to Your Group Feed!", "Добро Пожаловать в Ленту Группы!")}
          </h2>
          <p className="text-xs text-slate-900/80 mt-1 max-w-xl">
            {t(
              "Ustozingiz tomonidan joylanadigan e'lonlar, vazifalar va o'quv materiallarini shu yerdan kuzatib boring.",
              "Track announcements, homework tasks, and downloadable study resources posted by your instructor.",
              "Следите за объявлениями, заданиями и учебными материалами от вашего преподавателя."
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
            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-2xl space-y-4"
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

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">{selectedAssignment.title}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                Deadline: {selectedAssignment.dueDate}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Javob matni / Insho (Solution Text)", "Your Answer / Essay", "Ваш Ответ / Эссе")}
              </label>
              <textarea
                required
                rows={5}
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder={t("Inshoingizni yoki topshiriq javoblarini shu yerga yozing...", "Type your essay or assignment response here...", "Напишите ваш ответ или эссе здесь...")}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Fayl Biriktirish (Ixtiyoriy PDF/Audio)", "Attach Document / File (Optional)", "Прикрепить Файл (Опционально)")}
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
        {/* Posts feed */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>{t("So'nggi E'lonlar va Vazifalar", "Recent Posts & Announcements", "Последние Объявления и Задания")}</span>
          </h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Inbox className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t("Ayni vaqtda guruh lentasida e'lonlar yo'q", "No announcements posted yet", "В ленте группы пока нет объявлений")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t(
                  "O'qituvchingiz guruhga vazifa yoki dars materiallarini joylaganda, ushbu lentalarda avtomatik ko'rinadi.",
                  "When your instructor posts homework or study resources, they will appear in this live feed.",
                  "Когда ваш преподаватель опубликует материалы, они появятся здесь."
                )}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4"
              >
                {/* Author & Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                      {post.avatar || 'T'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {post.author}
                      </h4>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {post.role} • {post.date}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {t("Rasmiy e'lon", "Announcement", "Объявление")}
                  </span>
                </div>

                {/* Title & Body */}
                <div>
                  <h5 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                    {post.title}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Attachment Card */}
                {post.attachment && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                          {post.attachment}
                        </p>
                        <p className="text-[10px] text-slate-400">{post.attachmentSize || '1.5 MB'}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
                      <Download className="w-3.5 h-3.5" />
                      <span>{t("Yuklash", "Download", "Скачать")}</span>
                    </button>
                  </div>
                )}

                {/* Comments Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">
                      {post.comments?.length || 0} {t("Izohlar", "Comments", "Комментарии")}
                    </span>
                    <button
                      onClick={() => setActivePostForComment(activePostForComment === post.id ? null : post.id)}
                      className="text-amber-500 hover:underline font-semibold cursor-pointer"
                    >
                      {t("Izoh qoldirish", "Add Comment", "Оставить комментарий")}
                    </button>
                  </div>

                  {post.comments?.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p>
                        <strong className="text-slate-900 dark:text-white mr-1">{c.author}:</strong>
                        {c.text}
                      </p>
                    </div>
                  ))}

                  {activePostForComment === post.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t("Izohingizni yozing...", "Write your comment...", "Напишите комментарий...")}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer hover:bg-amber-400"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Info & Pending Assignments */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("Topshirilishi Kerak Vazifalar", "Pending Assignments", "Предстоящие Задания")}</span>
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
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                        Deadline: {hw.dueDate}
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
                      {hw.group}
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
                <span>24/7 AI Tutor</span>
              </div>
              <h4 className="text-sm font-bold">
                {t("Insho xatolaringizni tekshirtiring", "Check Your Essay Errors Instantly", "Мгновенно проверяйте ошибки в эссе")}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t(
                  "Vazifani topshirishdan oldin AI Yordamchidan grammatika va leksikani tekshirib olishingiz mumkin.",
                  "Get immediate grammar and vocabulary feedback from AI Tutor before final submission.",
                  "Получите мгновенный отзыв по грамматике от AI Tutor перед отправкой."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

