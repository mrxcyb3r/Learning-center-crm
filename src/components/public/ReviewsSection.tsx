import React from 'react';
import { MessageSquareQuote } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
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

        <div className="mt-10 rounded-3xl p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <MessageSquareQuote className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hozircha ma'lumot yo'q. Haqiqiy fikrlar qo'shilgandan so'ng shu yerda ko'rinadi.
          </p>
        </div>
      </div>
    </section>
  );
};