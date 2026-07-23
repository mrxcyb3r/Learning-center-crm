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
  Inbox
} from 'lucide-react';
import { subscribeFeedPosts, subscribeAssignments, addPostComment } from '../../services/firestore';
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

  useEffect(() => {
    let unsubPosts: () => void = () => {};
    let unsubAssignments: () => void = () => {};

    setIsLoading(true);

    try {
      unsubPosts = subscribeFeedPosts((data) => {
        setPosts(data);
        setIsLoading(false);
      });

      unsubAssignments = subscribeAssignments((data) => {
        setAssignments(data);
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error fetching group feed:', err);
      setIsLoading(false);
    }

    return () => {
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
              assignments.map((hw) => (
                <div key={hw.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                    Deadline: {hw.dueDate}
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {hw.title}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {hw.group}
                  </p>
                </div>
              ))
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
