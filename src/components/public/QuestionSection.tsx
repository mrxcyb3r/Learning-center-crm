import React, { useState } from 'react';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { QuestionForm } from './QuestionForm';

export const QuestionSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="questions" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <MessageCircle className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Savol-javob</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Savolingiz bormi?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Administratorimizga savolingizni yuboring. Biz siz bilan tez orada bog'lanamiz.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-16 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-emerald-600 mb-2">Savolingiz yuborildi!</h3>
            <p className="text-slate-600 dark:text-slate-400">Tez orada siz bilan bog'lanamiz.</p>
            <button onClick={() => setSubmitted(false)} className="mt-6 px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm cursor-pointer">
              Yangi savol yuborish
            </button>
          </div>
        ) : (
          <QuestionForm onSuccess={() => setSubmitted(true)} />
        )}
      </div>
    </section>
  );
};
