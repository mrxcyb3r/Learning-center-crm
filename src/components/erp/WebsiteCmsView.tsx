import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Phone,
  BookOpen,
  Users,
  Award,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  MapPin,
  Send,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cmsService, faqsService, resultsService } from '../../services/repository';
import { CmsData, FaqItem, StudentResult } from '../../types/crm';

export const WebsiteCmsView: React.FC = () => {
  const [cms, setCms] = useState<CmsData | null>(null);
  // FAQ + Results tabs are backed by the SAME Firestore collections the public
  // landing page reads, so Admin edits appear on the site after reload.
  const [cmsFaqs, setCmsFaqs] = useState<FaqItem[]>([]);
  const [cmsResults, setCmsResults] = useState<StudentResult[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'stats' | 'results' | 'faqs' | 'contact'>('hero');
  const [loading, setLoading] = useState(true);

  // New FAQ Form
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // New Result Form
  const [newResName, setNewResName] = useState('');
  const [newResSubject, setNewResSubject] = useState('Tarix & Huquq');
  const [newResScore, setNewResScore] = useState('187.9');
  const [newResUni, setNewResUni] = useState("O'zDJTU");
  const [newResBadge, setNewResBadge] = useState('100% Davlat Granti');
  const [newResYear, setNewResYear] = useState('2025');
  const [newResPublished, setNewResPublished] = useState(true);
  const [isAddingResult, setIsAddingResult] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cmsData, faqs, results] = await Promise.all([
          cmsService.getCmsData().catch(() => null),
          faqsService.getAllFaqs().catch(() => [] as FaqItem[]),
          resultsService.getAllResults().catch(() => []),
        ]);
        if (cancelled) return;
        // hero/stats/contact tabs keep working even when cms/main was never
        // created: fall back to an empty draft instead of a stuck spinner.
        setCms(cmsData ?? {
          hero: { centerName: '', tagline: '', subtitle: '', badge: '' },
          stats: { universityAdmissions: '', studentAdmittedRatio: '', highestDtmScore: '', stateGrantsCount: '' },
          contact: { phone: '', telegram: '', branches: [] },
          faqs: [],
          results: [],
        });
        setCmsFaqs(faqs as FaqItem[]);
        setCmsResults(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshFaqs = async () => {
    try {
      setCmsFaqs(await faqsService.getAllFaqs() as FaqItem[]);
    } catch {
      // keep last known list on failure
    }
  };

  const refreshResults = async () => {
    try {
      setCmsResults(await resultsService.getAllResults());
    } catch {
      // keep last known list on failure
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await cmsService.updateCmsData(cms);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim()) return;

    await faqsService.createFaq({
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
      order: cmsFaqs.length + 1,
    });
    await refreshFaqs();
    setNewFaqQ('');
    setNewFaqA('');
    setIsAddingFaq(false);
  };

  const handleDeleteFaq = async (id: string) => {
    await faqsService.deleteFaq(id);
    await refreshFaqs();
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) return;

    await resultsService.createResult({
      studentName: newResName.trim(),
      subject: newResSubject.trim(),
      score: newResScore.trim(),
      university: newResUni.trim(),
      badge: newResBadge.trim(),
      year: newResYear.trim(),
      admissionType: newResBadge.trim().toLowerCase().includes('grant') ? 'Grant' : 'Kontrakt',
      published: newResPublished,
      order: cmsResults.length + 1,
    } as Omit<StudentResult, 'id'>);
    await refreshResults();
    setNewResName('');
    setNewResPublished(true);
    setIsAddingResult(false);
  };

  const handleDeleteResult = async (id: string) => {
    await resultsService.deleteResult(id);
    await refreshResults();
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      )}
      {!loading && (
      <>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Veb-sayt Kontenti va Veb-sayt Boshqaruvi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bosh sahifadagi shiorlar, DTM natijalari, aloqa ma'lumotlari va FAQ savollarini kod yozmasdan tahrirlang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Globe className="w-4 h-4" />
            <span>Saytni Ko'rish</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={() => handleSaveAll()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Barchasini Saqlash</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>O'zgarishlar muvaffaqiyatli saqlandi va saytda darhol yangilandi!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { id: 'hero', label: 'Bosh Sahifa & Shior', icon: Sparkles },
          { id: 'stats', label: 'Haqiqiy Statistikalar', icon: Award },
          { id: 'results', label: 'Talabalar Natijalari', icon: Users },
          { id: 'faqs', label: "Ko'p Beriladigan Savollar", icon: HelpCircle },
          { id: 'contact', label: 'Filiallar & Telefonlar', icon: Phone },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Tab 1: Hero */}
        {activeSubTab === 'hero' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Hero Banner & Shior</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Markaz Nomi
                </label>
                <input
                  type="text"
                  value={cms.hero.centerName}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      hero: { ...cms.hero, centerName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Bosh Shior (Tagline / Slogan)
                </label>
                <input
                  type="text"
                  value={cms.hero.tagline}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      hero: { ...cms.hero, tagline: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kichik Tavsif (Subtitle)
              </label>
              <textarea
                rows={2}
                value={cms.hero.subtitle}
                onChange={(e) =>
                  setCms({
                    ...cms,
                    hero: { ...cms.hero, subtitle: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Yuqori Belgi (Badge)
              </label>
              <input
                type="text"
                value={cms.hero.badge}
                onChange={(e) =>
                  setCms({
                    ...cms,
                    hero: { ...cms.hero, badge: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Real Stats */}
        {activeSubTab === 'stats' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Haqiqiy Statistikalar (Fake SaaS raqamlari emas!)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  OTMga kirish ko'rsatkichi
                </label>
                <input
                  type="text"
                  value={cms.stats.universityAdmissions}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      stats: { ...cms.stats, universityAdmissions: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-lg text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Talaba bo'lgan bitiruvchilar
                </label>
                <input
                  type="text"
                  value={cms.stats.studentAdmittedRatio}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      stats: { ...cms.stats, studentAdmittedRatio: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Eng yuqori DTM ball
                </label>
                <input
                  type="text"
                  value={cms.stats.highestDtmScore}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      stats: { ...cms.stats, highestDtmScore: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-lg text-amber-600 dark:text-amber-400"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Davlat granti sohiblari
                </label>
                <input
                  type="text"
                  value={cms.stats.stateGrantsCount}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      stats: { ...cms.stats, stateGrantsCount: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-lg text-sky-600 dark:text-sky-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Results */}
        {activeSubTab === 'results' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Talabalar Natijalari ({cmsResults.length})</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsAddingResult(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Natija Qo'shish</span>
              </button>
            </div>

            {/* Add Result Form */}
            {isAddingResult && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-amber-500/30 space-y-3">
                <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Yangi Natija / Talaba Kiritish
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium mb-1">O'quvchi F.I.SH</label>
                    <input
                      type="text"
                      required
                      placeholder="Hasanboyeva Sevinch"
                      value={newResName}
                      onChange={(e) => setNewResName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">DTM Ball / Sertifikat</label>
                    <input
                      type="text"
                      placeholder="187.9 ball"
                      value={newResScore}
                      onChange={(e) => setNewResScore(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Qabul qilingan OTM</label>
                    <input
                      type="text"
                      placeholder="O'zDJTU"
                      value={newResUni}
                      onChange={(e) => setNewResUni(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Yo'nalishi</label>
                    <input
                      type="text"
                      placeholder="Tarix & Huquq"
                      value={newResSubject}
                      onChange={(e) => setNewResSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Holati (Grant / To'lov)</label>
                    <input
                      type="text"
                      placeholder="100% Davlat Granti"
                      value={newResBadge}
                      onChange={(e) => setNewResBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Yili</label>
                    <input
                      type="text"
                      placeholder="2025"
                      value={newResYear}
                      onChange={(e) => setNewResYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newResPublished}
                        onChange={(e) => setNewResPublished(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Saytda nashr etish
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingResult(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleAddResult}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Qo'shish
                  </button>
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="space-y-2">
              {cmsResults.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {r.studentName}
                      {r.published === false && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 text-[9px] font-bold uppercase">Nashrda emas</span>
                      )}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {r.subject} • {r.university} ({r.year})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {r.published === false ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await resultsService.updateResult(r.id, { published: true });
                          await refreshResults();
                        }}
                        title="Saytda nashr etish"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await resultsService.updateResult(r.id, { published: false });
                          await refreshResults();
                        }}
                        title="Saytdan yashirish"
                        className="p-1.5 rounded-lg text-emerald-500 hover:text-slate-500 transition"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                      {r.score}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {r.badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteResult(r.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: FAQs */}
        {activeSubTab === 'faqs' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Ko'p Beriladigan Savollar (FAQ)</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsAddingFaq(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Savol Qo'shish</span>
              </button>
            </div>

            {isAddingFaq && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-amber-500/30 space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Savol matni</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Bepul sinov darsi qanday o'tkaziladi?"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Javob matni</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Sinov darsida o'quvchi darajasi aniqlanadi va ustoz bilan tanishiladi..."
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingFaq(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold"
                  >
                    Qo'shish
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {cmsFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1 relative"
                >
                  <div className="flex items-start justify-between pr-8">
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {faq.question}
                    </h5>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 absolute top-3 right-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Contact */}
        {activeSubTab === 'contact' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500" />
              <span>Markaz Filiallari va Aloqa Ma'lumotlari</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Bosh Telefon (Call Center)
                </label>
                <input
                  type="text"
                  value={cms.contact.phone}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      contact: { ...cms.contact, phone: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Telegram Kanal / Bot
                </label>
                <input
                  type="text"
                  value={cms.contact.telegram}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      contact: { ...cms.contact, telegram: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Filiallar Manzillari
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  1-Filial (Asosiy Filial)
                </label>
                <input
                  type="text"
                  value={cms.contact.branches[0] || ''}
                  onChange={(e) => {
                    const newBranches = [...cms.contact.branches];
                    newBranches[0] = e.target.value;
                    setCms({
                      ...cms,
                      contact: { ...cms.contact, branches: newBranches },
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  2-Filial (Texnikum binosi)
                </label>
                <input
                  type="text"
                  value={cms.contact.branches[1] || ''}
                  onChange={(e) => {
                    const newBranches = [...cms.contact.branches];
                    newBranches[1] = e.target.value;
                    setCms({
                      ...cms,
                      contact: { ...cms.contact, branches: newBranches },
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button at bottom */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>O'zgarishlarni Saqlash va E'lon Qilish</span>
          </button>
        </div>
      </form>
      </>
      )}
    </div>
  );
};
