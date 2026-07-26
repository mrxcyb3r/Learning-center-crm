import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Newspaper,
  Plus,
  Send,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  Clock,
  Sparkles,
  Globe,
  Edit2
} from 'lucide-react';

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  status: 'Published' | 'Draft';
  imageUrl?: string;
  content?: string;
}

export const BlogCMSView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: 'b1',
      title: "IELTS Writing Task 2 da 8.0+ Band Olish Sirlari va Strukturasi",
      category: 'IELTS Maslahatlar',
      author: 'Jasur Rahimov',
      date: '2026-07-21',
      status: 'Published',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
      content: 'IELTS Insho yozishda eng muhim narsa - kalit so\'zlar va argumentlarning aniqligi...'
    },
    {
      id: 'b2',
      title: "Renessans LC O'quvchisi IELTS 8.5 Natijani Qo'lga Kiritdi!",
      category: 'Muvaffaqiyat Tarixi',
      author: 'Admin Team',
      date: '2026-07-18',
      status: 'Published',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      content: 'CenterFlow orqali tayyorgarlik ko\'rgan o\'quvchimiz birinchi urinishda 8.5 oldi!'
    }
  ]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IELTS Maslahatlar');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [isCreating, setIsCreating] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPost: BlogPost = {
      id: Date.now().toString(),
      title,
      category,
      author: 'CenterFlow Admin',
      date: new Date().toISOString().split('T')[0],
      status,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
      content
    };

    setPosts([newPost, ...posts]);
    setTitle('');
    setImageUrl('');
    setContent('');
    setIsCreating(false);
    showToast(t("Yangi blog maqolasi e'lon qilindi! 📰", "New article published successfully! 📰", "Статья успешно опубликована! 📰"));
  };

  const handleToggleStatus = (id: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          const newStatus = p.status === 'Published' ? 'Draft' : 'Published';
          showToast(t(`Status '${newStatus}' ga o'zgardi`, `Status changed to '${newStatus}'`, `Статус изменен на '${newStatus}'`));
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
    showToast(t("Maqola o'chirildi", "Article deleted", "Статья удалена"));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30 mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>CenterFlow Public Blog & Announcements CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("Blog CMS & Yangiliklar Boshqaruvi", "Blog CMS & News Publisher", "Управление Блогом и Новостями")}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "O'quv markazi e'lonlari, IELTS bo'yicha maslahatlar va muvaffaqiyat hikoyalarini bosh sahifada e'lon qiling.",
              "Create and publish educational articles, student success stories, and center news on the landing page.",
              "Публикация новостей учебного центра, советов по IELTS и историй успеха."
            )}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("Yangi Maqola Yozish", "Publish Blog Post", "Опубликовать Блог")}</span>
        </button>
      </div>

      {/* Editor Form */}
      {isCreating && (
        <form onSubmit={handlePublish} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4 animate-fade-in">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-amber-500" />
            <span>{t("Yangi Maqolani Chop Etish", "Create & Publish Blog Post", "Создать Новую Статью")}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Maqola Sarlavhasi *", "Article Title *", "Заголовок Статьи *")}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="IELTS Listening 9.0 Strategy 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Kategoriya *", "Category *", "Категория *")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="IELTS Maslahatlar">{t("IELTS Maslahatlar", "IELTS Tips", "Советы IELTS")}</option>
                <option value="Muvaffaqiyat Tarixi">{t("Muvaffaqiyat Tarixi", "Success Stories", "Истории Успеха")}</option>
                <option value="E'lonlar">{t("E'lonlar va Yangiliklar", "Announcements & News", "Объявления и Новости")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Rasm URL Linki", "Featured Image URL", "Ссылка на Изображение")}
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Chop Etish Holati", "Publication Status", "Статус Публикации")}
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="Published">{t("Chop etilgan (Live) ✅", "Published (Live) ✅", "Опубликовано ✅")}</option>
                <option value="Draft">{t("Qoralama (Draft) 📝", "Draft 📝", "Черновик 📝")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t("Maqola Matni", "Article Content", "Текст Статьи")}
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("Maqola mazmunini va batafsil tavsiflarni kiriting...", "Write the full article content here...", "Введите текст статьи...")}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t("Bekor qilish", "Cancel", "Отмена")}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t("Chop etish", "Publish Post", "Опубликовать")}</span>
            </button>
          </div>
        </form>
      )}

      {/* Articles Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            {t("E'lon Qilingan Maqolalar Ro'yxati", "Published Articles Roster", "Список Статей")}
          </h3>
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
            {posts.length} Posts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-36 object-cover rounded-xl"
                  />
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                    {post.category}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(post.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition ${
                      post.status === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {post.status === 'Published' ? 'Live ✅' : 'Draft 📝'}
                  </button>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                  {post.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {post.content || 'Article content body preview...'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-400 font-mono">
                <span>{post.author} • {post.date}</span>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
