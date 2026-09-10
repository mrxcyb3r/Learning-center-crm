import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FileText,
  Upload,
  Award,
  BookOpen,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { TeacherDocument } from '../../../types/teacher';

const DOC_TYPES: { value: TeacherDocument['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'certificate', label: 'Sertifikat', icon: <Award className="w-4 h-4" /> },
  { value: 'diploma', label: 'Diplom', icon: <Award className="w-4 h-4" /> },
  { value: 'teaching_material', label: 'O\'quv material', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'other', label: 'Boshqa', icon: <FileText className="w-4 h-4" /> },
];

function getDocTypeBadgeClass(type: string) {
  switch (type) {
    case 'certificate':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    case 'diploma':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'teaching_material':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
  }
}

function getDocTypeIcon(type: string) {
  switch (type) {
    case 'certificate':
      return <Award className="w-4 h-4 text-amber-500" />;
    case 'diploma':
      return <Award className="w-4 h-4 text-emerald-500" />;
    case 'teaching_material':
      return <BookOpen className="w-4 h-4 text-blue-500" />;
    default:
      return <FileText className="w-4 h-4 text-slate-500" />;
  }
}

export const TeacherDocumentsView: React.FC = () => {
  const { teacherUid } = useTeacherPortal();
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<TeacherDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<TeacherDocument['type']>('certificate');
  const [formUrl, setFormUrl] = useState('');
  const [formVisible, setFormVisible] = useState(true);

  useEffect(() => {
    if (!teacherUid) return;
    setIsLoading(true);
    const q = query(collection(db, 'teacher_documents'), where('teacherId', '==', teacherUid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: TeacherDocument[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<TeacherDocument, 'id'>),
        }));
        items.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        setDocuments(items);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Firestore subscribeTeacherDocuments notice:', error);
        setDocuments([]);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [teacherUid]);

  const handleUpload = async () => {
    if (!formName.trim()) {
      toast.error('Hujjat nomi kiritilishi shart');
      return;
    }
    if (!formUrl.trim()) {
      toast.error('Hujjat manzili (URL) kiritilishi shart');
      return;
    }
    try {
      await addDoc(collection(db, 'teacher_documents'), {
        name: formName.trim(),
        type: formType,
        fileUrl: formUrl.trim(),
        uploadedAt: new Date().toISOString(),
        visibleToAdmin: formVisible,
        teacherId: teacherUid,
      });
      toast.success('Hujjat yuklandi');
      setFormName('');
      setFormType('certificate');
      setFormUrl('');
      setFormVisible(true);
      setShowUploadForm(false);
    } catch {
      toast.error('Hujjatni yuklashda xatolik');
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc(doc(db, 'teacher_documents', docId));
      toast.success('Hujjat o\'chirildi');
    } catch {
      toast.error('Hujjatni o\'chirishda xatolik');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`text-lg font-extrabold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Hujjatlar
            </h2>
            <p
              className={`text-xs font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {documents.length} ta hujjat yuklandi
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition cursor-pointer"
        >
          {showUploadForm ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {showUploadForm ? 'Bekor qilish' : 'Hujjat yuklash'}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div
          className={`p-5 rounded-2xl border ${
            theme === 'dark'
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Hujjat nomi
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. IELTS Teaching Certificate"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Hujjat turi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DOC_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    onClick={() => setFormType(dt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formType === dt.value
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-indigo-500/50'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-500/50'
                    }`}
                  >
                    {dt.icon}
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Hujjat manzili (URL)
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormVisible(!formVisible)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    formVisible
                      ? 'bg-indigo-500/10 text-indigo-500'
                      : theme === 'dark'
                      ? 'bg-slate-800 text-slate-500'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {formVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <span
                  className={`text-xs font-semibold ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {formVisible ? 'Admin uchun ko\'rinadigan' : 'Admin uchun yashirin'}
                </span>
              </div>

              <button
                onClick={handleUpload}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition cursor-pointer"
              >
                Hujjatni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border animate-pulse h-40 ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div
          className={`py-20 text-center rounded-2xl border ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
              theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <FileText className="w-6 h-6" />
          </div>
          <p
            className={`text-sm font-bold ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Hujjatlar yuklanmagan
          </p>
          <p
            className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Sertifikatlarni, diplomlarni yoki o'quv materiallarini yuklang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((docItem) => (
            <div
              key={docItem.id}
              className={`p-4 rounded-2xl border transition group ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30'
                  : 'bg-white border-slate-200 hover:border-indigo-500/30 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
                  }`}
                >
                  {getDocTypeIcon(docItem.type)}
                </div>
                <div className="flex items-center gap-1">
                  {docItem.visibleToAdmin ? (
                    <Eye
                      className={`w-3.5 h-3.5 ${
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                      }`}
                    />
                  ) : (
                    <EyeOff
                      className={`w-3.5 h-3.5 ${
                        theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    />
                  )}
                  <button
                    onClick={() => handleDelete(docItem.id)}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer ${
                      theme === 'dark'
                        ? 'text-slate-600 hover:text-rose-400 hover:bg-slate-800'
                        : 'text-slate-300 hover:text-rose-500 hover:bg-slate-100'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4
                className={`text-sm font-extrabold truncate mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {docItem.name}
              </h4>

              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${getDocTypeBadgeClass(
                    docItem.type
                  )}`}
                >
                  {DOC_TYPES.find((d) => d.value === docItem.type)?.label || docItem.type}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {formatDate(docItem.uploadedAt)}
                </span>
              </div>

              {docItem.fileUrl && (
                <a
                  href={docItem.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 flex items-center gap-1.5 text-xs font-bold transition ${
                    theme === 'dark'
                      ? 'text-indigo-400 hover:text-indigo-300'
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Hujjatni ochish
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
