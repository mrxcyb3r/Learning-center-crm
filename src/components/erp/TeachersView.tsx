import React, { useState, useEffect } from 'react';
import {
  Award,
  Briefcase,
  GraduationCap,
  Phone,
  DollarSign,
  Users,
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { teachersService } from '../../services/repository';
import { TeacherGender, TeacherRecord, TeacherStatus } from '../../types/crm';
import { TeacherAvatar } from '../common/TeacherAvatar';
import { TeacherInvitations } from './TeacherInvitations';
import { formatCurrency } from '../../utils/format';

export const TeachersView: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formGender, setFormGender] = useState<TeacherGender>('male');
  const [formSubject, setFormSubject] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formQualification, setFormQualification] = useState('');
  const [formExperience, setFormExperience] = useState('3 yil');
  const [formMonthlySalary, setFormMonthlySalary] = useState('9000000');
  const [formPhone, setFormPhone] = useState('+998 ');
  const [formTelegram, setFormTelegram] = useState('@');
  const [formPhoto, setFormPhoto] = useState('');
  const [formStatus, setFormStatus] = useState<TeacherStatus>('Active');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formDescription, setFormDescription] = useState('');
  const [formAchievements, setFormAchievements] = useState('');

  const refreshTeachers = async () => {
    // Admin-only merged fetch: public profile + private compensation.
    const data = await teachersService.getAllTeachersWithComp();
    setTeachers(data as unknown as TeacherRecord[]);
  };

  useEffect(() => {
    refreshTeachers();
  }, []);

  const showNotification = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormGender('male');
    setFormSubject('');
    setFormSpecialization('');
    setFormQualification('');
    setFormExperience('3 yil');
    setFormMonthlySalary('9000000');
    setFormPhone('+998 ');
    setFormTelegram('@');
    setFormPhoto('');
    setFormStatus('Active');
    setFormIsPublic(true);
    setFormDescription('');
    setFormAchievements('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherRecord) => {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormFirstName(t.firstName || '');
    setFormMiddleName(t.middleName || '');
    setFormLastName(t.lastName || '');
    setFormGender(t.gender || 'male');
    setFormSubject(t.subject || '');
    setFormSpecialization(t.specialization || '');
    setFormQualification(t.qualification || '');
    setFormExperience(t.experience || '3 yil');
    setFormMonthlySalary(String(t.monthlySalary || 8000000));
    setFormPhone(t.phone || '+998 ');
    setFormTelegram(t.telegram || '@');
    setFormPhoto(t.photo || '');
    setFormStatus(t.status || 'Active');
    setFormIsPublic(t.isPublic ?? true);
    setFormDescription(t.description || '');
    setFormAchievements((t.achievements || []).join('\n'));
    setIsAddModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Surat hajmi 2MB dan kichik bo'lishi kerak!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    const structuredName = [formFirstName, formMiddleName, formLastName].filter(Boolean).join(' ').trim();
    if (!formName.trim() && !structuredName) return;

    const achievementsList = formAchievements
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    const payload = {
      name: structuredName || formName.trim(),
      firstName: formFirstName.trim(),
      middleName: formMiddleName.trim(),
      lastName: formLastName.trim(),
      gender: formGender,
      subject: formSubject.trim() || formSpecialization.trim(),
      specialization: formSpecialization.trim() || formSubject.trim(),
      qualification: formQualification.trim(),
      experience: formExperience.trim(),
      monthlySalary: Number(formMonthlySalary) || 0,
      salary: Number(formMonthlySalary) || 0,
      phone: formPhone.trim(),
      telegram: formTelegram.trim(),
      photo: formPhoto.trim(),
      status: formStatus,
      isPublic: formIsPublic,
      description: formDescription.trim(),
      achievements: achievementsList,
    };

    if (editingTeacher) {
      await teachersService.updateTeacher(editingTeacher.id, payload);
      showNotification(`${formName} ma'lumotlari yangilandi!`);
    } else {
      await teachersService.createTeacher({
        ...payload,
        activeGroups: 0,
        studentsCount: 0,
        salaryStatus: 'Paid',
        // displayOrder is required: ordered Firestore queries exclude
        // documents that lack the ordered field entirely.
        displayOrder: teachers.length + 1,
      });
      showNotification(`Yangi ustoz ${formName} muvaffaqiyatli qo'shildi!`);
    }

    await refreshTeachers();
    setIsAddModalOpen(false);
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (window.confirm(`Rostdan ham ${name} ustozni o'chirmoqchimisiz?`)) {
      await teachersService.deleteTeacher(id);
      await refreshTeachers();
      showNotification(`${name} o'chirildi.`);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (filterStatus === 'All') return true;
    return t.status === filterStatus;
  });

  const totalMonthlyPayroll = teachers.reduce((sum, t) => sum + (t.monthlySalary || 0), 0);

  const structuredNamePreview = [formFirstName, formMiddleName, formLastName].filter(Boolean).join(' ').trim();

  return (
    <div className="space-y-6">
      {/* Header & KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Ustozlar va Pedagogik Jamoa ({teachers.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Barcha o'qituvchilar ro'yxati, real yuklama, dars berayotgan guruhlari va oylik maoshlari.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Ustoz Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Payroll and Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Jami Ustozlar</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {teachers.length} nafar
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            {teachers.filter((t) => t.status === 'Active').length} faol ishlamoqda
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Oylik Pedagogik Fond (Maoshlar)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalMonthlyPayroll)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Haqiqiy shartnoma bo'yicha</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Saytda Ko'rinadigan Ustozlar</span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {teachers.filter((t) => t.isPublic !== false).length} ta
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Bosh sahifada faol</span>
        </div>
      </div>

      {/* One-time onboarding invitations (admin-only) */}
      <TeacherInvitations />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['All', 'Active', 'On Leave', 'Archived'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              filterStatus === st
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {st === 'All' ? 'Barchasi' : st === 'Active' ? 'Faol' : st === 'On Leave' ? "Ta'tilda" : 'Arxiv'}
          </button>
        ))}
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length === 0 && (
          <div className="col-span-full py-14 text-center text-sm text-slate-400 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            Hozircha ma'lumot yo'q. Yangi ustoz qo'shing yoki filtrni o'zgartiring.
          </div>
        )}
        {filteredTeachers.map((t) => (
          <div
            key={t.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition duration-200"
          >
            <div>
              {/* Photo Area with Gender-Specific SVG Fallback (NO Unsplash!) */}
              <div className="h-56 overflow-hidden relative">
                <TeacherAvatar
                  photo={t.photo}
                  name={t.name}
                  gender={t.gender}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                      t.status === 'Active'
                        ? 'bg-emerald-500/90 text-white'
                        : t.status === 'On Leave'
                        ? 'bg-amber-500/90 text-slate-950'
                        : 'bg-slate-600/90 text-white'
                    }`}
                  >
                    {t.status === 'Active' ? 'Faol' : t.status === 'On Leave' ? "Ta'tilda" : 'Arxiv'}
                  </span>

                  {t.isPublic === false && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-rose-300 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Saytda yopiq
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-white/10">
                  {t.experience}
                </div>
              </div>

              {/* Information */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {t.name}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                      {t.subject || t.specialization}
                    </p>
                  </div>
                </div>

                {t.qualification && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {t.qualification}
                  </p>
                )}

                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {t.phone}
                </p>

                {/* Cohorts & Headcount Dynamic Stats */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Guruhlari</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {t.activeGroups} ta faol guruh
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">O'quvchilari</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {t.studentsCount} ta o'quvchi
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions & Salary */}
            <div className="p-5 pt-0 space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Oylik Maoshi:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                  {formatCurrency(t.monthlySalary || t.salary)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Tahrirlash</span>
                </button>
                <button
                  onClick={() => handleDeleteTeacher(t.id, t.name)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingTeacher ? `Ustozni tahrirlash: ${editingTeacher.name}` : "Yangi Ustoz Qo'shish"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs sm:text-sm">
              {/* Photo Upload & Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                  <TeacherAvatar
                    photo={formPhoto}
                    name={formName || 'Ustoz'}
                    gender={formGender}
                    className="w-full h-full"
                  />
                </div>
                <div className="space-y-2 flex-1 w-full text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    O'qituvchi Surati (Ixtiyoriy)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Agar surat yuklanmasa, erkak/ayol belgisiga qarab toza professional avatar ko'rsatiladi.
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Surat yuklash</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormPhoto('')}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-rose-500 hover:text-white transition"
                      >
                        Suratni o'chirish
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Row: Structured name parts (optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ism (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="Diyorbek"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Otasining ismi (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formMiddleName}
                    onChange={(e) => setFormMiddleName(e.target.value)}
                    placeholder="Furqat o'g'li"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Familiya (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="Furqatov"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {structuredNamePreview && (
                  <p className="sm:col-span-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Saytdagi to'liq ism: {structuredNamePreview}
                  </p>
                )}
              </div>

              {/* Row: Name and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    F.I.SH (To'liq ismi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Masalan: Diyorbek Furqatovich"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Jinsi (Avatar uchun)
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as TeacherGender)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="male">Erkak (Erkak ustoz avatari)</option>
                    <option value="female">Ayol (Ayol ustoz avatari)</option>
                  </select>
                </div>
              </div>

              {/* Row: Specialization and Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fani / Yo'nalishi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Masalan: Tarix & Huquq"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ixtisosligi / Mutaxassisligi
                  </label>
                  <input
                    type="text"
                    value={formSpecialization}
                    onChange={(e) => setFormSpecialization(e.target.value)}
                    placeholder="Masalan: DTM va Milliy Sertifikat Tarix"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row: Phone, Telegram, Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Telefon raqami
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 (90) 123-45-67"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Telegram nik / havola
                  </label>
                  <input
                    type="text"
                    value={formTelegram}
                    onChange={(e) => setFormTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tajribasi
                  </label>
                  <input
                    type="text"
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                    placeholder="Masalan: 6 yil"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row: Salary, Status, Public Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Oylik Maoshi (UZS) *
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={formMonthlySalary}
                    onChange={(e) => setFormMonthlySalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ish faoliyati holati
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TeacherStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Active">Faol ishlamoqda</option>
                    <option value="On Leave">Ta'tilda</option>
                    <option value="Archived">Arxivlangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Saytda Ko'rinish
                  </label>
                  <div className="flex items-center h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPublic}
                        onChange={(e) => setFormIsPublic(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Bosh sahifada ko'rinsin
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Qualifications & Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Malaka / Ma'lumoti
                </label>
                <input
                  type="text"
                  value={formQualification}
                  onChange={(e) => setFormQualification(e.target.value)}
                  placeholder="Masalan: Oliy toifali mutaxassis, Davlat granti sohibi ustozi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ustoz haqida qisqacha tavsif (Sayt uchun)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="O'qituvchining dars berish uslubi va yutuqlari..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Yutuqlari (Har bir qatorda bittadan)
                </label>
                <textarea
                  rows={2}
                  value={formAchievements}
                  onChange={(e) => setFormAchievements(e.target.value)}
                  placeholder="187.9 eng yuqori DTM balli sohibi ustozi&#10;2 nafar 100% davlat granti talabasi ustozi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  {editingTeacher ? "O'zgarishlarni Saqlash" : "Ustozni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
