import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
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
  Sparkles
} from 'lucide-react';

export const GroupFeed: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [comments, setComments] = useState<{ [postId: string]: string[] }>({
    p1: ["I've submitted my Task 2 essay!", "Rahmat ustoz, audio material fayllari ochildi."]
  });
  const [newComment, setNewComment] = useState('');
  const [activePostForComment, setActivePostForComment] = useState<string | null>(null);

  const posts = [
    {
      id: 'p1',
      author: 'Jasur Rahimov (Head Mentor)',
      role: 'IELTS Teacher',
      avatar: 'J',
      date: 'Bugun, 10:30',
      title: isUz ? "Dars materiallari & Writing Task 2 Vaziya" : "Class Materials & Writing Task 2 Essay",
      content: isUz
        ? "Salom o'quvchilar! Bugungi darsimizda Writing Task 2 bo'yicha 'Technology in Education' mavzusini ko'rib chiqdik. Qo'shimcha namuna va audiolarni pastdagi fayldan yuklab oling. Uy vazifasini juma kuniga qadar topshirishingiz so'raladi."
        : "Hello students! In today's session we covered Writing Task 2 topic 'Technology in Education'. Download the sample materials below and submit your essays by Friday.",
      attachment: 'IELTS_Writing_Task2_Sample_Tech.pdf',
      attachmentSize: '2.4 MB',
      likes: 12
    },
    {
      id: 'p2',
      author: 'Malika Azimova',
      role: 'Reading & Vocabulary Specialist',
      avatar: 'M',
      date: 'Kecha, 16:45',
      title: isUz ? "Shanba kunlik Bepul Mock IELTS Imtihoni" : "Saturday Free Mock IELTS Exam Schedule",
      content: isUz
        ? "Diqqat! Ushbu shanba soat 09:00 da navbatdagi BEPUL Mock IELTS bo'lib o'tadi. Barcha IELTS Intensive va General English o'quvchilari qatnashishi shart. O'zingiz bilan pasport va qalam olib keling."
        : "Attention! This Saturday at 09:00 AM our free Mock IELTS will take place. All IELTS Intensive and General English students are required to attend.",
      attachment: 'Mock_Exam_Rules_2026.pdf',
      attachmentSize: '1.1 MB',
      likes: 18
    }
  ];

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment.trim()]
    }));
    setNewComment('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Group Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider">
            {isUz ? "Guruhingiz: IELTS Intensive #12" : "Your Group: IELTS Intensive #12"}
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-2">
            {isUz ? "Guruh Lentasiga Xush Kelibsiz!" : "Welcome to Your Group Feed!"}
          </h2>
          <p className="text-xs text-slate-900/80 mt-1 max-w-xl">
            {isUz
              ? "Ustozingiz tomonidan joylanadigan e'lonlar, vazifalar va o'quv materiallarini shu yerdan kuzatib boring."
              : "Track announcements, homework tasks, and downloadable study resources posted by your instructor."}
          </p>
        </div>

        <div className="bg-slate-950/10 backdrop-blur-md p-4 rounded-2xl border border-slate-950/20 text-xs shrink-0 font-semibold space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{isUz ? "Dushanba / Chorshanba / Juma" : "Mon / Wed / Fri"}</span>
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
            <span>{isUz ? "So'nggi E'lonlar va Vazifalar" : "Recent Posts & Announcements"}</span>
          </h3>

          {posts.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4"
            >
              {/* Author & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    {post.avatar}
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
                  {isUz ? "Rasmiy e'lon" : "Announcement"}
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
                      <p className="text-[10px] text-slate-400">{post.attachmentSize}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <Download className="w-3.5 h-3.5" />
                    <span>{isUz ? "Yuklash" : "Download"}</span>
                  </button>
                </div>
              )}

              {/* Comments Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold">
                    {comments[post.id]?.length || 0} {isUz ? "Izohlar" : "Comments"}
                  </span>
                  <button
                    onClick={() => setActivePostForComment(activePostForComment === post.id ? null : post.id)}
                    className="text-amber-500 hover:underline font-semibold cursor-pointer"
                  >
                    {isUz ? "Izoh qoldirish" : "Add Comment"}
                  </button>
                </div>

                {comments[post.id]?.map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <User className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p>{c}</p>
                  </div>
                ))}

                {activePostForComment === post.id && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={isUz ? "Izohingizni yozing..." : "Write your comment..."}
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
          ))}
        </div>

        {/* Sidebar Info & Schedule */}
        <div className="space-y-6">
          {/* Upcoming Homework Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUz ? "Topshirilishi Kerak Vazifalar" : "Pending Assignments"}</span>
            </h4>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                Juma, 23:59
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Writing Task 2: Technology Essay
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isUz ? "Kamida 250 so'zdan iborat insho yozib kelish" : "Minimum 250-word essay submission"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                Shanba, 09:00
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Mock IELTS Practice Exam
              </p>
            </div>
          </div>

          {/* Quick AI Help Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>24/7 AI Tutor</span>
              </div>
              <h4 className="text-sm font-bold">
                {isUz ? "Insho xatolaringizni tekshirtiring" : "Check Your Essay Errors Instantly"}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isUz
                  ? "Vazifani topshirishdan oldin AI Yordamchidan grammatika va leksikani tekshirib olishingiz mumkin."
                  : "Get immediate grammar and vocabulary feedback from AI Tutor before final submission."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
