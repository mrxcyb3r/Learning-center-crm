import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Upload, CheckCircle2, Clock, AlertCircle, Send, Paperclip } from 'lucide-react';

export const HomeworkView: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [assignments, setAssignments] = useState([
    {
      id: 'hw1',
      title: 'Writing Task 2: Impact of AI on Future Jobs',
      group: 'IELTS Intensive #12',
      dueDate: '2026-07-25',
      submittedCount: 12,
      totalStudents: 14,
      file: 'AI_Impact_Reading_Task.pdf'
    },
    {
      id: 'hw2',
      title: 'Listening Section 3 Audio Drill & Vocabulary',
      group: 'General English B2',
      dueDate: '2026-07-24',
      submittedCount: 9,
      totalStudents: 10,
      file: 'Section3_Audio_Drill.mp3'
    }
  ]);

  const [title, setTitle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('IELTS Intensive #12');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newHw = {
      id: Date.now().toString(),
      title,
      group: selectedGroup,
      dueDate: dueDate || '2026-07-30',
      submittedCount: 0,
      totalStudents: 14,
      file: file ? file.name : 'Assignment_Guide.pdf'
    };

    setAssignments([newHw, ...assignments]);
    setTitle('');
    setDueDate('');
    setFile(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">
            {isUz ? "Vazifalar & Audio/PDF Yuklamalar" : "Homework & Media Management"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isUz
              ? "O'quvchilaringizga dars audiolari, insho topshiriqlari va PDF resurslarini e'lon qiling."
              : "Upload listening mp3s, PDF files, and essay assignments for your classes."}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>{isUz ? "Yangi Vazifa Yuklash" : "Create Assignment"}</span>
        </button>
      </div>

      {/* New Assignment Modal / Form */}
      {isCreating && (
        <form onSubmit={handleCreateAssignment} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {isUz ? "Yangi Topshiriq Yaratish" : "Upload New Assignment"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topshiriq Sarlavhasi
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: IELTS Writing Task 2 Essay"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guruhni Tanlang
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                <option value="IELTS Intensive #12">IELTS Intensive #12</option>
                <option value="General English B2">General English B2</option>
                <option value="CEFR C1 Master">CEFR C1 Master</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topshirish Muddat (Deadline)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fayl Biriktirish (PDF/MP3)
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
            >
              E'lon qilish
            </button>
          </div>
        </form>
      )}

      {/* Active Assignments List */}
      <div className="space-y-4">
        {assignments.map((hw) => (
          <div
            key={hw.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                {hw.group}
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {hw.title}
              </h4>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                  {hw.file}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  Deadline: {hw.dueDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {hw.submittedCount} / {hw.totalStudents} Topshirildi
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">
                  {Math.round((hw.submittedCount / hw.totalStudents) * 100)}% Bajarildi
                </span>
              </div>

              <button className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer">
                Tekshirish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
