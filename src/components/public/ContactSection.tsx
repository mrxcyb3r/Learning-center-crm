import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Send, Clock, Navigation, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cmsBridge } from '../../services/cmsBridge';

interface ContactSectionProps {
  onOpenTrialModal: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenTrialModal }) => {
  const [contact, setContact] = useState(cmsBridge.getContact());

  useEffect(() => {
    setContact(cmsBridge.getContact());
  }, []);

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Bog'lanish & Manzillarimiz
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Renessans O'quv Markaziga Tashrif Buyuring
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            O'quv markazimiz filiallariga keling yoki telefon orqali bepul maslahat oling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Telefon va Ma'lumot
                </h4>
                <div className="space-y-1 mt-1">
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                    className="text-lg font-bold text-slate-900 dark:text-white hover:text-amber-500 transition block font-mono"
                  >
                    {contact.phone}
                  </a>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Har kuni 08:00 dan 20:00 gacha qo'ng'iroqlarga javob beramiz.
                </p>
              </div>
            </div>

            {/* Telegram */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Telegram Murojaat
                </h4>
                <a
                  href={`https://t.me/${contact.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-bold text-slate-900 dark:text-white hover:text-sky-500 transition flex items-center gap-1.5 mt-0.5"
                >
                  <span>{contact.telegram}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Savollaringizni yozing, tezkor javob beramiz.
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ish Tartibi
                </h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Dushanba – Shanba: 08:00 – 19:00
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Yakshanba: Haftalik diagnostik sinov testlari kuni
                </p>
              </div>
            </div>
          </div>

          {/* Locations & CTA */}
          <div className="lg:col-span-7 space-y-6">
            {/* Location 1 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/30 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black text-lg">
                  1
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-[11px] uppercase tracking-wider">
                    Asosiy Bino
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    RENESSANS O'quv Markazi
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                    <span>{contact.branches[0] || "Yangiobod tumani 1-sonli umumiy o'rta ta'lim maktabi binosi"}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Tarix, huquq, matematika, ona tili va CEFR darslari o'tkaziladigan asosiy filial.
                  </p>
                </div>
              </div>
            </div>

            {/* Location 2 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 font-black text-lg border border-amber-500/20">
                  2
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                    2-Filial
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    NODIRABEGIM EDUCATION
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                    <span>{contact.branches[1] || "Yangiobod tuman texnikumi binosi"}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Mental arifmetika, ingliz tili va qo'shimcha akademik to'garaklar filiali.
                  </p>
                </div>
              </div>
            </div>

            {/* Consultation Banner */}
            <div className="p-7 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/20">
              <div>
                <h4 className="text-xl font-black tracking-tight">
                  Savollaringiz bormi?
                </h4>
                <p className="text-xs sm:text-sm font-semibold opacity-90 mt-1">
                  Administratorimizga yoziling yoki 1-bepul sinov darsiga joy band qiling.
                </p>
              </div>
              <button
                onClick={onOpenTrialModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-black text-xs uppercase tracking-wider transition cursor-pointer shrink-0 shadow-lg"
              >
                Sinov darsiga yozilish
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
