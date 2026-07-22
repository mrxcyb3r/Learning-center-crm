import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Newspaper, Plus, Send, CheckCircle2, FileText, Image } from 'lucide-react';

export const BlogCMSView: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [posts, setPosts] = useState([
    {
      id: 'b1',
      title: 'IELTS Writing Task 2 da 8.0+ Band Olish Sirlari',
      category: 'IELTS Maslahatlar',
      author: 'Jasur Rahimov',
      date: '2026-07-21',
      status: 'Published'
    },
    {
      id: 'b2',
      title: 'Renessans LC O\'quvchisi IELTS 8.5 Natijani Qo\'lga Kiritdi!',
      category: 'Muvaffaqiyat Tarixi',
      author: 'Admin Team',
      date: '2026-07-18',
      status: 'Published'
    }
  ]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IELTS Maslahatlar');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newPost = {
      id: Date.now().toString(),
      title,
      category,
      author: 'Renessans Admin',
      date: new Date().toISOString().split('T')[0],
      status: 'Published'
    };

    setPosts([newPost, ...posts]);
    setTitle('');
    setContent('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30 mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Blog & E'lonlar CMS</span>
          </div>
          <h2 className="text-2xl font-black">
            {isUz ? "Yangiliklar va Maqolalar Publisher" : "Public Blog & News CMS"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {isUz
              ? "Markaz xabarlari, o'quvchilar muvaffaqiyati va IELTS maslahatlarini e'lon qiling."
              : "Publish center news, student achievement stories, and IELTS prep articles."}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isUz ? "Yangi Maqola Yozish" : "Create Blog Post"}</span>
        </button>
      </div>

      {/* Editor Form */}
      {isCreating && (
        <form onSubmit={handlePublish} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {isUz ? "Yangi Maqolani Chop Etish" : "Publish New Article"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maqola Sarlavhasi
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="IELTS Listening Tips 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategoriya
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="IELTS Maslahatlar">IELTS Maslahatlar</option>
                <option value="Muvaffaqiyat Tarixi">Muvaffaqiyat Tarixi</option>
                <option value="E'lonlar">E'lonlar va Yangiliklar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Maqola Matni
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Maqola matni va foydali maslahatlarni kiriting..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chop etish</span>
            </button>
          </div>
        </form>
      )}

      {/* Published Posts Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Sarlavha</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4">Muallif</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{p.title}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{p.author}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-500">
                    {p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
