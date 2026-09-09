import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Send, Phone, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base">
                R
              </div>
              <div>
                <span className="text-lg font-black text-white tracking-tight block leading-tight">
                  RENESSANS LC
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  Bilimdan Natijaga!
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Yangioboddagi zamonaviy o'quv markazi. Milliy sertifikat, DTM, CEFR va maktab fanlari bo'yicha kafolatlangan ta'lim.
            </p>
            <div className="pt-2 flex items-center gap-3 text-white">
              <a
                href="https://t.me/D_Furqatovich"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center transition"
                title="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="tel:+998886484949"
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center transition"
                title="Telefon"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Courses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Asosiy Kurslar
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#courses" className="hover:text-amber-400 transition">
                  Tarix, Huquq, Geografiya
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-amber-400 transition">
                  Matematika & SAT
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-amber-400 transition">
                  CEFR Ingliz tili (B2/C1)
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-amber-400 transition">
                  Mental Arifmetika
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-amber-400 transition">
                  Ona tili va Adabiyot
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-amber-400 transition">
                  English Kids
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Filiallar */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Filiallarimiz
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>1-Filial:</strong> Yangiobod tumani 1-sonli umumiy o'rta ta'lim maktabi binosi
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>2-Filial:</strong> Yangiobod tuman texnikumi (NODIRABEGIM EDUCATION)
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacts & Admin */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Aloqa & Tizim
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <p className="text-white font-bold">+998 (88) 648-49-49</p>
              <p className="text-white font-bold">+998 (99) 259-32-32</p>
              <p className="text-slate-400 font-sans">Ish vaqti: 08:00 – 19:00</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Admin ERP Tizimi</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} RENESSANS O'quv Markazi. Barcha huquqlar himoyalangan.</p>
          <p className="flex items-center gap-1">
            Bilimdan natijaga!
          </p>
        </div>
      </div>
    </footer>
  );
};
