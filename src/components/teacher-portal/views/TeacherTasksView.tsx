import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Check,
  Trash2,
  Clock,
  Calendar,
  ListTodo,
  X,
} from 'lucide-react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { TeacherTask } from '../../../types/teacher';

export const TeacherTasksView: React.FC = () => {
  const { teacherUid } = useTeacherPortal();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    if (!teacherUid) return;
    setIsLoading(true);
    const q = query(collection(db, 'teacher_tasks'), where('teacherId', '==', teacherUid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: TeacherTask[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<TeacherTask, 'id'>),
        }));
        items.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setTasks(items);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Firestore subscribeTasks notice:', error);
        setTasks([]);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [teacherUid]);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.status === 'pending' && t.dueDate === todayStr),
    [tasks, todayStr]
  );

  const upcomingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'pending' && (!t.dueDate || t.dueDate >= todayStr) && t.dueDate !== todayStr),
    [tasks, todayStr]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'completed'),
    [tasks]
  );

  const handleAddTask = async () => {
    if (!newTitle.trim()) {
      toast.error('Sarlavha kiritilishi shart');
      return;
    }
    try {
      await addDoc(collection(db, 'teacher_tasks'), {
        title: newTitle.trim(),
        description: newDescription.trim() || '',
        dueDate: newDueDate || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        teacherId: teacherUid,
      });
      toast.success('Vazifa qo\'shildi');
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setShowAddForm(false);
    } catch {
      toast.error('Vazifani qo\'shishda xatolik');
    }
  };

  const handleToggleComplete = async (task: TeacherTask) => {
    try {
      await updateDoc(doc(db, 'teacher_tasks', task.id), {
        status: task.status === 'completed' ? 'pending' : 'completed',
      });
    } catch {
      toast.error('Vazifani yangilashda xatolik');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'teacher_tasks', taskId));
      toast.success('Vazifa o\'chirildi');
    } catch {
      toast.error('Vazifani o\'chirishda xatolik');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (dueDate: string) => {
    return dueDate && dueDate < todayStr;
  };

  const renderTaskItem = (task: TeacherTask) => (
    <div
      key={task.id}
      className={`flex items-start gap-3 p-3 rounded-xl border transition group ${
        task.status === 'completed'
          ? theme === 'dark'
            ? 'bg-slate-800/30 border-slate-800 opacity-60'
            : 'bg-slate-50 border-slate-200 opacity-60'
          : theme === 'dark'
          ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <button
        onClick={() => handleToggleComplete(task)}
        className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
          task.status === 'completed'
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : theme === 'dark'
            ? 'border-slate-600 hover:border-blue-500'
            : 'border-slate-300 hover:border-blue-500'
        }`}
      >
        {task.status === 'completed' && <Check className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-bold ${
            task.status === 'completed'
              ? 'line-through'
              : ''
          } ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p
            className={`text-xs mt-0.5 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {task.description}
          </p>
        )}
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold ${
              isOverdue(task.dueDate) && task.status !== 'completed'
                ? 'text-rose-500'
                : theme === 'dark'
                ? 'text-slate-500'
                : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
            {isOverdue(task.dueDate) && task.status !== 'completed' && ' (Muddati o\'tgan)'}
          </span>
        )}
      </div>

      <button
        onClick={() => handleDeleteTask(task.id)}
        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer ${
          theme === 'dark'
            ? 'text-slate-600 hover:text-rose-400 hover:bg-slate-800'
            : 'text-slate-300 hover:text-rose-500 hover:bg-slate-100'
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                : 'bg-purple-500/10 border-purple-500/20 text-purple-600'
            }`}
          >
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`text-lg font-extrabold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Mening vazifalarim
            </h2>
            <p
              className={`text-xs font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {todayTasks.length} bugun &middot; {upcomingTasks.length} kelgusi
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition cursor-pointer"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Bekor qilish' : 'Vazifa qo\'shish'}
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div
          className={`p-4 rounded-2xl border ${
            theme === 'dark'
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Vazifa sarlavhasi *"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500'
              }`}
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Tavsif (ixtiyoriy)"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500'
              }`}
            />
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                }`}
              />
              <button
                onClick={handleAddTask}
                className="px-5 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border animate-pulse h-16 ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
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
            <ListTodo className="w-6 h-6" />
          </div>
          <p
            className={`text-sm font-bold ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Hozircha vazifalar yo'q
          </p>
          <p
            className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Boshlash uchun "Vazifa qo'shish" tugmasini bosing.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3
                  className={`text-xs font-black uppercase tracking-widest ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Bugungi vazifalar
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black">
                  {todayTasks.length}
                </span>
              </div>
              <div className="space-y-2">{todayTasks.map(renderTaskItem)}</div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3
                  className={`text-xs font-black uppercase tracking-widest ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Kelgusi vazifalar
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black">
                  {upcomingTasks.length}
                </span>
              </div>
              <div className="space-y-2">{upcomingTasks.map(renderTaskItem)}</div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <h3
                  className={`text-xs font-black uppercase tracking-widest ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Yakunlangan
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black">
                  {completedTasks.length}
                </span>
              </div>
              <div className="space-y-2">{completedTasks.map(renderTaskItem)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
