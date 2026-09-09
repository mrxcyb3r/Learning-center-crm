import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    q: "Sinov darsi qanday o'tkaziladi va to'lov bormi?",
    a: "Sinov darsi mutlaqo bepul! O'quvchi markazga kelib, diagnostik test topshiradi va o'z bilimi darajasiga mos guruh darsiga qatnashib, ustozning dars o'tish uslubi bilan tanishadi.",
  },
  {
    q: "Renessans o'quv markazi Yangiobodning qaysi joylarida joylashgan?",
    a: "Bizda 2 ta filial mavjud: 1-filial — Yangiobod tumani 1-sonli umumiy o'rta ta'lim maktabi binosida; 2-filial — Yangiobod tuman texnikumi (NODIRABEGIM EDUCATION) binosida joylashgan.",
  },
  {
    q: "Milliy sertifikat va DTM guruhlariga qabul qachon boshlanadi?",
    a: "Qabul yil davomida davom etadi. Darslar ertalabki, tushki va kechki smenalarda tashkil etilgan. Yangi guruhlar shakllanishi bilan bepul sinov darslariga chaqiriladi.",
  },
  {
    q: "Haftalik diagnostik testlar qachon o'tkaziladi?",
    a: "Har yakshanba kuni markazimizda DTM va Milliy sertifikat formatidagi qat'iy nazorat ostida diagnostik testlar o'tkaziladi va natijalar ota-onalarga shaxsan yetkaziladi.",
  },
  {
    q: "To'lovlarni qanday usulda amalga oshirish mumkin?",
    a: "To'lovlarni markaz binosida naqd pul orqali, yoki Click va Payme ilovalari orqali masofadan turib qulay to'lashingiz mumkin.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-100/60 dark:bg-slate-900/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Ko'p Beriladigan Savollar
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Savol-Javoblar
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
            O'quv jarayoni, qabul va kafolatlar bo'yicha eng muhim ma'lumotlar.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_LIST.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>{item.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
