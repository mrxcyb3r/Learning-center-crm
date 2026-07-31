import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Award, CheckCircle2, Save, Sparkles, User, History, Loader2, BookOpen, Layers, Sliders, CheckSquare } from 'lucide-react';
import { saveMockScore, subscribeMockScores, subscribeStudents, notifyStudentGradePublished } from '../../services/firestore';
import { DEFAULT_MOCK_STUDENTS, DEFAULT_MOCK_SCORES } from '../../data/mockData';
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
  
  // Subject and Grading System State
  const [subjectCategory, setSubjectCategory] = useState('📐 Mathematics & Geometry');
  const [gradingSystem, setGradingSystem] = useState<'Test Score' | 'Percentage' | 'Letter Grade' | 'Rubric'>('Test Score');
  
  // Test Score / IELTS / CEFR Fields
  const [listening, setListening] = useState('7.5');
  const [reading, setReading] = useState('7.0');
  const [writing, setWriting] = useState('6.5');
  const [speaking, setSpeaking] = useState('7.5');

  // Percentage Field
  const [percentageScore, setPercentageScore] = useState('88');

  // Letter Grade Field
  const [letterGrade, setLetterGrade] = useState<'A+' | 'A' | 'B' | 'C' | 'D' | 'F'>('A');

  // Rubric Fields (Accuracy 0-10, Reasoning 0-10, Style/Method 0-10)
  const [rubricAccuracy, setRubricAccuracy] = useState('9');
  const [rubricReasoning, setRubricReasoning] = useState('8');
  const [rubricMethod, setRubricMethod] = useState('9');

  const [feedback, setFeedback] = useState('Great analytical problem solving and clear step-by-step methodology.');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubStudents = subscribeStudents((stList) => {
      if (!isMounted) return;
      const effectiveStudents = stList.length > 0 ? stList : DEFAULT_MOCK_STUDENTS;
      setStudents(effectiveStudents);
      if (effectiveStudents.length > 0 && !studentName) {
        setStudentName(effectiveStudents[0].fullName);
        setSelectedStudentId(effectiveStudents[0].id);
      }
      setIsLoading(false);
    });

    const unsubScores = subscribeMockScores((scoresList) => {
      if (!isMounted) return;
      setMockScores(scoresList.length > 0 ? scoresList : DEFAULT_MOCK_SCORES);
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

  // Compute calculated overall result based on active grading system
  const calculateOverallDisplay = () => {
    if (gradingSystem === 'Percentage') {
      return `${percentageScore}%`;
    }
    if (gradingSystem === 'Letter Grade') {
      return `Grade ${letterGrade}`;
    }
    if (gradingSystem === 'Rubric') {
      const total = Number(rubricAccuracy) + Number(rubricReasoning) + Number(rubricMethod);
      return `${total} / 30 Points`;
    }
    // Default Test Score / Band Score
    const rawOverall = (
      (parseFloat(listening || '0') +
        parseFloat(reading || '0') +
        parseFloat(writing || '0') +
        parseFloat(speaking || '0')) / 4
    );
    return `Band ${roundToIELTSBand(rawOverall).toFixed(1)}`;
  };

  const calculatedNumericOverall = () => {
    if (gradingSystem === 'Percentage') return Number(percentageScore);
    if (gradingSystem === 'Rubric') return Number(rubricAccuracy) + Number(rubricReasoning) + Number(rubricMethod);
    const rawOverall = (
      (parseFloat(listening || '0') +
        parseFloat(reading || '0') +
        parseFloat(writing || '0') +
        parseFloat(speaking || '0')) / 4
    );
    return roundToIELTSBand(rawOverall);
  };

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
      const stId = selectedStudentId || Date.now().toString();
      await saveMockScore({
        studentId: stId,
        studentName: studentName || 'Student',
        date: new Date().toISOString().split('T')[0],
        subjectCategory,
        gradingSystem,
        overall: calculatedNumericOverall(),
        letterGrade: gradingSystem === 'Letter Grade' ? letterGrade : undefined,
        percentage: gradingSystem === 'Percentage' ? Number(percentageScore) : undefined,
        listening: gradingSystem === 'Test Score' ? roundToIELTSBand(parseFloat(listening || '0')) : undefined,
        reading: gradingSystem === 'Test Score' ? roundToIELTSBand(parseFloat(reading || '0')) : undefined,
        writing: gradingSystem === 'Test Score' ? roundToIELTSBand(parseFloat(writing || '0')) : undefined,
        speaking: gradingSystem === 'Test Score' ? roundToIELTSBand(parseFloat(speaking || '0')) : undefined,
        teacherFeedback: feedback
      });

      // Notify student
      await notifyStudentGradePublished(
        stId,
        studentName || 'Student',
        subjectCategory,
        calculateOverallDisplay(),
        feedback
      );

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
            <span>Universal Learning Center Gradebook</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {t("Baholash & Multi-Subject Gradebook", "Universal Gradebook & Assessment System", "Журнал Оценок & Оценка Предметов")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "Matematika, Fizika, IT, SAT va Tillar bo'yicha turli baholash tizimlarida (Foiz %, Letter Grade A-F, Test Ball yoki Rubrika) o'quvchilarni baholang.",
              "Evaluate students across Math, Physics, Programming, SAT, and Languages using flexible grading scales (Percentage, Letter Grade, Test Score, or Rubric).",
              "Оценивайте студентов по всем предметам с помощью удобных систем оценок (% foiz, A-F, тестовые баллы, рубрика)."
            )}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{t("Natija va feedback Firestore ga saqlandi va o'quvchi profiliga biriktirildi! ✅", "Score and evaluation saved strictly to Firestore! ✅", "Результат и отзыв сохранены в Firestore! ✅")}</span>
        </div>
      )}

      {/* Gradebook Form */}
      <form onSubmit={handleSaveGrade} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {t("Fan / Fan Yo'nalishi", "Subject / Track", "Предмет / Направление")}
            </label>
            <select
              value={subjectCategory}
              onChange={(e) => setSubjectCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-bold"
            >
              <option value="📐 Mathematics & Geometry">📐 Mathematics & Geometry</option>
              <option value="⚡ Physics & Engineering">⚡ Physics & Engineering</option>
              <option value="🧪 Chemistry & Biology">🧪 Chemistry & Biology</option>
              <option value="💻 IT & Computer Science">💻 IT & Computer Science</option>
              <option value="🎯 SAT / GMAT Quantitative">🎯 SAT / GMAT Quantitative</option>
              <option value="🌐 Languages & IELTS/CEFR">🌐 Languages & IELTS/CEFR</option>
              <option value="📚 General Science & Humanities">📚 General Science & Humanities</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Baholash Tizimi", "Grading System / Scale", "Система Оценивания")}
            </label>
            <select
              value={gradingSystem}
              onChange={(e) => setGradingSystem(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-bold"
            >
              <option value="Test Score">Test Score / Band (Sub-scores 0.0 - 9.0)</option>
              <option value="Percentage">Percentage (0% - 100%)</option>
              <option value="Letter Grade">Letter Grade (A+, A, B, C, D, F)</option>
              <option value="Rubric">Custom Rubric Evaluation (Accuracy, Logic, Method)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Inputs Based on Grading System */}
        {gradingSystem === 'Test Score' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("Bo'limlar Bo'yicha Sub-scorelar (.0 yoki .5 qadami bilan)", "Skill Sub-scores (Official .0 or .5 steps)", "Баллы по Секциям (шаг .0 или .5)")}
              </span>
              <span className="text-[10px] font-mono text-amber-500 font-bold">4-Skill Test Scale</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Listening / Skill 1
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
                  Reading / Skill 2
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
                  Writing / Skill 3
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
                  Speaking / Skill 4
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
        )}

        {gradingSystem === 'Percentage' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">{t("Imtihon Balli (Foizda 0% - 100%)", "Exam Percentage Score (0% - 100%)", "Балл за Экзамен (0% - 100%)")}</span>
              <span className="text-amber-500 font-mono text-base font-black">{percentageScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percentageScore}
              onChange={(e) => setPercentageScore(e.target.value)}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        )}

        {gradingSystem === 'Letter Grade' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t("Harfiy Bahoni Tanlang (A+ - F)", "Select Letter Grade (A+ to F)", "Выберите Буквенную Оценку")}</span>
            <div className="flex items-center gap-2">
              {(['A+', 'A', 'B', 'C', 'D', 'F'] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setLetterGrade(g)}
                  className={`flex-1 py-3 rounded-xl font-black text-sm cursor-pointer transition ${
                    letterGrade === g
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {gradingSystem === 'Rubric' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Accuracy & Correctness (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={rubricAccuracy}
                onChange={(e) => setRubricAccuracy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Reasoning & Method (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={rubricReasoning}
                onChange={(e) => setRubricReasoning(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Style & Execution (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={rubricMethod}
                onChange={(e) => setRubricMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-center"
              />
            </div>
          </div>
        )}

        {/* Calculated Overall Band Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{t("Hisoblangan Umumiy Natija:", "Calculated Final Evaluation Score:", "Рассчитанная Итоговая Оценка:")}</span>
          </div>
          <span className="text-2xl font-black text-amber-500 font-mono tracking-tight">{calculateOverallDisplay()}</span>
        </div>

        {/* Feedback Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t("Ustoz Mulohazalari va Maslahatlar (Feedback)", "Teacher Feedback & Coaching Notes", "Замечания и Отзыв Преподавателя")}
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
                  <th className="py-2.5 px-2">{t("Fan / Yo'nalish", "Subject", "Предмет")}</th>
                  <th className="py-2.5 px-2">{t("Sana", "Date", "Дата")}</th>
                  <th className="py-2.5 px-2 text-right">Overall Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockScores.slice(-10).reverse().map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                      {sc.studentName}
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-medium text-xs">
                      {sc.subjectCategory || '📐 Mathematics'}
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-[11px]">
                      {sc.date}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/20">
                        {sc.letterGrade
                          ? `Grade ${sc.letterGrade}`
                          : sc.percentage
                          ? `${sc.percentage}%`
                          : `Band ${sc.overall?.toFixed(1)}`}
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

