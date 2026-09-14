import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowRight, Search, Sparkles } from 'lucide-react';
import { PublicLayout } from '../components/public/PublicLayout';
import { SEOHead } from '../components/SEOHead';

export const NotFoundPage: React.FC = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="Sahifa topilmadi — Renessans O'quv Markazi"
        description="Kechirasiz, qidirgan sahifa topilmadi yoki mavjud emas. Bosh sahifaga qayting yoki kurslar katalogidan foydalaning."
      />
      <div className="pt-32 pb-24 min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <Sparkles className="w-20 h-20 mx-auto mb-6 text-amber-500/50 animate-pulse" />
            <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">404</h1>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">
            Sahifa topilmadi
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Kechirasiz, siz qidirgan sahifa mavjud emas yoki o'chirilgan. Ehtimol noto'g'ri URL kiritdingiz yoki sahifa boshqa manzilga ko'chirilgan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition"
            >
              <Home className="w-4 h-4" />
              <span>Bosh sahifaga qaytish</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider hover:border-amber-500 hover:text-amber-500 transition"
            >
              <Search className="w-4 h-4" />
              <span>Kurslarni ko'rish</span>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};