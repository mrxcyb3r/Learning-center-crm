import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Award, CheckCircle2, Save, Sparkles, User, History, Loader2, BookOpen } from 'lucide-react';
import { saveMockScore, subscribeMockScores, subscribeStudents } from '../../services/firestore';
import { roundToIELTSBand } from '../../services/gemini';
import { MockTestScore, Student } from '../../types';

export const GradebookView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [mockScores, setMockScores] = useState<MockTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [studentName, setStudentName] = useState('Jasur Rahimov');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [testType, setTestType] = useState<'IELTS' | 'CEFR'>('IELTS');
  const [listening, setListening] = useState('7.5');
  const [reading, setReading] = useState('7.0');
  const [writing, setWriting] = useState('6.5');
  const [speaking, setSpeaking] = useState('7.5');
  const [feedback, setFeedback] = useState('Writing Task 2 inshoda tahlil yetarlicha chuqur, lekin paragraflar oralig\'idagi bog\'lovchi so\'zlarga ko\'proq e\'tibor qaratish kerak.');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubStudents = subscribeStudents((stList) => {
      if (!isMounted) return;
      setStudents(stList);
      if (stList.length > 0 && !studentName) {
        setStudentName(stList[0].fullName);
        setSelectedStudentId(stList[0].id);
      }
      setIsLoading(false);
    });

    const unsubScores = subscribeMockScores((scoresList) => {
      if (!isMounted) return;
      setMockScores(scoresList);
      setIsLoading(false);
    });

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubStudents();
      unsubScores();
    };
  }, []);

  const rawOverall = (
    (parseFloat(listening || '0') +
      parseFloat(reading || '0') +
      parseFloat(writing || '0') +
      parseFloat(speaking || '0')) /
    4
  );

  // Official IELTS Band Rounding (.0 or .5 steps)
  const calculatedOverall = roundToIELTSBand(rawOverall).toFixed(1);

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const st = students.find((s) => s.id === val);
    if (st) {
      setSelectedStudentId(st.id);
      setStudentName(st.fullName);
    } else {
      setStudentName(val);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveMockScore({
        studentId: selectedStudentId || Date.now().toString(),
        studentName: studentName || 'Student',
        date: new Date().toISOString().split('T')[0],
        overall: parseFloat(calculatedOverall),
        listening: roundToIELTSBand(parseFloat(listening || '0')),
        reading: roundToIELTSBand(parseFloat(reading || '0')),
        writing: roundToIELTSBand(parseFloat(writing || '0')),
        speaking: roundToIELTSBand(parseFloat(speaking || '0')),
        teacherFeedback: feedback
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving score to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>IELTS & CEFR Official Gradebook</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {t("Baholash & IELTS Score Recorder", "Gradebook & Essay Scoring Tool", "Журнал Оценок & IELTS Score Recorder")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "O'quvchilarning Mock IELTS / CEFR ballarini kiritib, rasmiy band qoidalariga ko'ra baholang va Firestore ga saqlang.",
              "Record mock scores with official IELTS band increments (.0 or .5), generate breakdowns, and store in Firestore.",
              "Записывайте результаты экзаменов с официальными баллами IELTS (.0 или .5) и сохраняйте в Firestore."
            )}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{t("Natija va feedback Firestore ga saqlandi va o'quvchi profiliga biriktirildi! ✅", "Score and feedback saved strictly to Firestore! ✅", "Результат и отзыв сохранены в Firestore! ✅")}</span>
        </div>
      )}

      {/* Gradebook Form */}
      <form onSubmit={handleSaveGrade} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("O'quvchini Tanlang", "Select Student", "Выберите Ученика")}
            </label>
            {students.length > 0 ? (
              <select
                value={selectedStudentId}
                onChange={handleStudentSelect}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-extrabold"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.groupName || 'Group'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-bold"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Imtihon Turi", "Test Type", "Тип Экзамена")}
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-bold"
            >
              <option value="IELTS">IELTS Mock Exam (0.0 - 9.0)</option>
              <option value="CEFR">CEFR B2/C1 National Exam</option>
            </select>
          </div>
        </div>

        {/* 4 Skills Inputs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t("Bo'limlar Bo'yicha Sub-scorelar (.0 yoki .5 qadami bilan)", "Skill Sub-scores (Official .0 or .5 steps)", "Баллы по Секциям (шаг .0 или .5)")}
            </span>
            <span className="text-[10px] font-mono text-amber-500 font-bold">Official IELTS Scale</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Listening
              </label>
              <input
                type="text"
                value={listening}
                onChange={(e) => setListening(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Reading
              </label>
              <input
                type="text"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Writing
              </label>
              <input
                type="text"
                value={writing}
                onChange={(e) => setWriting(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Speaking
              </label>
              <input
                type="text"
                value={speaking}
                onChange={(e) => setSpeaking(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white text-center"
              />
            </div>
          </div>
        </div>

        {/* Calculated Overall Band Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{t("Hisoblangan Rasmiy Overall Band Score:", "Calculated Official Overall Band Score:", "Рассчитанный Официальный Общий Балл:")}</span>
          </div>
          <span className="text-2xl font-black text-amber-500 font-mono tracking-tight">{calculatedOverall}</span>
        </div>

        {/* Feedback Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t("Insho va Dars Bo'yicha Ustoz Mulohazalari (Feedback)", "Teacher Essay Feedback & Coaching Notes", "Замечания и Отзыв Преподавателя")}
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? t("Saqlanmoqda...", "Saving...", "Сохранение...") : t("Natijani Saqlash va Firestore ga Yozish", "Save Grade to Firestore", "Сохранить Результат в Firestore")}</span>
        </button>
      </form>

      {/* History Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {t("So'nggi Saqlangan Imtihon Natijalari (Firestore)", "Recent Recorded Mock Scores", "Недавние Сохраненные Результаты")}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {mockScores.length} {t("ta yozuv", "records", "записей")}
          </span>
        </div>

        {mockScores.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            {t("Hali Firestore ga imtihon natijalari saqlanmagan.", "No mock exam scores recorded yet.", "Пока нет записанных результатов.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2">{t("O'quvchi", "Student", "Ученик")}</th>
                  <th className="py-2.5 px-2">{t("Sana", "Date", "Дата")}</th>
                  <th className="py-2.5 px-2 text-center">L / R / W / S</th>
                  <th className="py-2.5 px-2 text-right">Overall Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockScores.slice(-10).reverse().map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                      {sc.studentName}
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-[11px]">
                      {sc.date}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {sc.listening} / {sc.reading} / {sc.writing} / {sc.speaking}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/20">
                        Band {sc.overall?.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
