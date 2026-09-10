import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Users, DollarSign, CheckCircle, UserCog, MessageSquare, ArrowRight, AlertCircle, Bell } from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatCard } from '../shared/StatCard';
import { subscribeNotifications } from '../../../services/firestore';
import { AppNotification } from '../../../types';
import { TeacherTab } from '../../../types/teacher';

export const TeacherDashboardView: React.FC = () => {
  const { stats, myGroups, myStudents, payments, setActiveTab, teacherUid } = useTeacherPortal();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsub = subscribeNotifications(teacherUid, 'teacher', (items) => {
      setNotifications(items.slice(0, 5));
    });
    return () => unsub?.();
  }, [teacherUid]);

  const unpaidStudents = useMemo(
    () => myStudents.filter((s) => s.paymentStatus !== 'paid'),
    [myStudents]
  );

  const quickActions: { tab: TeacherTab; icon: React.ReactNode; label: string; color: string }[] = [
    { tab: 'timetable', icon: <Calendar className="w-5 h-5" />, label: 'Timetable', color: 'from-blue-500 to-indigo-500' },
    { tab: 'students', icon: <Users className="w-5 h-5" />, label: 'Students', color: 'from-emerald-500 to-teal-500' },
    { tab: 'attendance', icon: <CheckCircle className="w-5 h-5" />, label: 'Attendance', color: 'from-purple-500 to-violet-500' },
    { tab: 'payments', icon: <DollarSign className="w-5 h-5" />, label: 'Payments', color: 'from-amber-500 to-orange-500' },
    { tab: 'announcements', icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', color: 'from-rose-500 to-pink-500' },
    { tab: 'profile', icon: <UserCog className="w-5 h-5" />, label: 'Profile', color: 'from-cyan-500 to-sky-500' },
  ];

  const formatAmount = (amount: number) => `${amount.toLocaleString()} UZS`;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          value={stats.todayClasses}
          label="Today's Classes"
          color="blue"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          value={stats.activeStudentCount}
          label="Active Students"
          color="emerald"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          value={formatAmount(stats.monthlyIncome)}
          label="Monthly Income"
          color="amber"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          value={`${stats.attendanceRate}%`}
          label="Attendance Rate"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div
        className={`rounded-2xl p-5 border transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/50 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3 className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.tab}
              onClick={() => setActiveTab(action.tab)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg`}>
                {action.icon}
              </div>
              <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div
          className={`rounded-2xl p-5 border transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Today's Classes
            </h3>
            <button
              onClick={() => setActiveTab('timetable')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {myGroups.length === 0 ? (
              <div className={`text-center py-6 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No classes scheduled</p>
              </div>
            ) : (
              myGroups.map((group) => (
                <div
                  key={group.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition ${
                    theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {group.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {group.scheduleTime} &middot; {group.room}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500">{group.activeStudentsCount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div
          className={`rounded-2xl p-5 border transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Recent Notifications
            </h3>
            <button
              onClick={() => setActiveTab('announcements')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className={`text-center py-6 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition ${
                    theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    n.isRead ? 'bg-slate-500/10' : 'bg-blue-500/10'
                  }`}>
                    <Bell className={`w-4 h-4 ${n.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {n.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{n.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {unpaidStudents.length > 0 && (
        <div
          className={`rounded-2xl p-5 border transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Pending Payments
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                {unpaidStudents.length}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('payments')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {unpaidStudents.slice(0, 5).map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-xl transition ${
                  theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    student.paymentStatus === 'overdue' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                  }`}>
                    <AlertCircle className={`w-4 h-4 ${
                      student.paymentStatus === 'overdue' ? 'text-rose-500' : 'text-amber-500'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {student.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{student.groupName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-500">{formatAmount(student.tuitionFee)}</div>
                  <div className={`text-[10px] font-semibold capitalize ${
                    student.paymentStatus === 'overdue' ? 'text-rose-500' : 'text-amber-500'
                  }`}>
                    {student.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardView;
