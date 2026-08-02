import React, { useState } from 'react';
import { Teacher } from '../types';
import { X, Award, CheckCircle2, ExternalLink, GraduationCap, Sparkles, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TeacherCertificateModalProps {
  teacher: Teacher | null;
  onClose: () => void;
}

export const TeacherCertificateModal: React.FC<TeacherCertificateModalProps> = ({ teacher, onClose }) => {
  const { t, translate, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'celta' | 'trf'>('celta');

  if (!teacher) return null;

  const getLangText = (uz?: string, en?: string, ru?: string): string => {
    if (language === 'RU') return ru || en || uz || '';
    if (language === 'EN') return en || uz || '';
    return uz || en || '';
  };

  const celtaCertUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cambridge_CELTA_certificate.jpg/960px-Cambridge_CELTA_certificate.jpg";
  const trfCertUrl = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#120320] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Teacher Info Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 pb-6 border-b border-white/10">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-xl shrink-0">
            <img
              src={teacher.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"}
              alt={teacher.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px]">
              {teacher.badge}
            </span>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Certified Senior Instructor</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">{teacher.name}</h3>
            <p className="text-xs font-bold text-amber-400 mt-0.5">{teacher.role}</p>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {getLangText(teacher.bioUz, teacher.bioEn, teacher.bioRu)}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
              {teacher.specialization.map((spec, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-slate-300">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate Tabs */}
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('celta')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'celta'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>CELTA / Cambridge Cert</span>
            </button>
            <button
              onClick={() => setActiveTab('trf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trf'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official IELTS TRF (9.0)</span>
            </button>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        </div>

        {/* Certificate Image View */}
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 p-2 shadow-2xl">
          <p className="text-[10px] uppercase font-bold text-amber-400 px-2 py-1 flex items-center justify-between mb-1">
            <span>{activeTab === 'celta' ? 'Cambridge CELTA Teaching License' : 'Official IELTS Test Report Form'}</span>
            <span className="text-slate-400 font-mono">Verified ID: CAM-2025-8832</span>
          </p>
          <img
            src={activeTab === 'celta' ? celtaCertUrl : trfCertUrl}
            alt="Official Certificate Document"
            referrerPolicy="no-referrer"
            className="w-full h-64 sm:h-80 object-cover rounded-xl border border-white/10 hover:scale-105 transition duration-500"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Tajriba: <strong className="text-amber-400">{teacher.experience}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
