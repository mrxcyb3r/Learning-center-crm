import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote, Award, CheckCircle2 } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Hasanboyeva Sevinch',
    role: 'O\'zDJTU Talabasi (Davlat granti, 187.9 ball)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    stars: 5,
    text: "Renessans o'quv markazidagi ustozlarning tizimli darslari va har haftalik test tahlillari tufayli 187.9 ball to'plab, O'zbekiston Davlat Jahon Tillari Universitetiga 100% davlat granti bilan o'qishga kirdim!",
    course: 'CEFR Ingliz tili & Ona tili',
  },
  {
    name: 'Davronov Bahrombek',
    role: 'Yurisprudensiya talabasi (Davlat granti sohibi)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    stars: 5,
    text: "Davlatbek ustozning tarix va huquq fanlari bo'yicha maxsus mualliflik metodikasi imtihonda deyarli barcha savollarni adashmasdan yechishimga yordam berdi. Yangioboddagi eng kuchli markaz!",
    course: 'Tarix, Huquq, Geografiya',
  },
  {
    name: 'Nodira opa (Ota-ona)',
    role: "Mental arifmetika o'quvchisi onasi",
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    stars: 5,
    text: "O'g'lim 3-sinfda o'qiydi. Inomjon ustozning darslariga qatnashganidan beri og'zaki hisoblash tezligi va xotirasi ancha kuchaydi. Maktab baholari ham faqat 5 bo'ldi.",
    course: 'Mental Arifmetika',
  },
];

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            O'quvchilar va Ota-onalar Fikrlari
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Natijalarimiz — Bizning Yuzimiz
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            O'quvchilarimiz va ularning ota-onalari Renessans o'quv markazidagi ta'lim sifati haqida nima deyishadi?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between relative group hover:border-amber-500/40 transition"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(t.stars)].map((_, sIdx) => (
                    <Star key={sIdx} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{t.text}"
                </p>

                {/* Course tag */}
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.course}</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-500/20"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
