import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Bell,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Megaphone,
  PartyPopper,
  UserPlus,
  BookOpen,
} from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  subscribeNotifications,
  markNotificationAsRead,
} from '../../../services/firestore';
import { AppNotification } from '../../../types';

type FilterTab = 'all' | 'unread' | 'holiday' | 'timetable' | 'enrollment' | 'meeting';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'meeting', label: 'Meeting' },
];

function getCategoryIcon(category: string) {
  switch (category) {
    case 'assignment_created':
      return <BookOpen className="w-4 h-4 text-indigo-500" />;
    case 'submission_received':
      return <Users className="w-4 h-4 text-emerald-500" />;
    case 'grade_published':
      return <Calendar className="w-4 h-4 text-amber-500" />;
    case 'announcement':
    default:
      return <Bell className="w-4 h-4 text-blue-500" />;
  }
}

function mapCategoryToFilter(category: string): FilterTab {
  const lower = category.toLowerCase();
  if (lower.includes('holiday')) return 'holiday';
  if (lower.includes('timetable') || lower.includes('schedule')) return 'timetable';
  if (lower.includes('enroll') || lower.includes('new_student')) return 'enrollment';
  if (lower.includes('meeting')) return 'meeting';
  return 'all';
}

export const TeacherAnnouncementsView: React.FC = () => {
  const { teacherUid } = useTeacherPortal();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeNotifications(teacherUid, 'teacher', (data) => {
      const filtered = data.filter(
        (n) =>
          n.recipientRole === 'teacher' ||
          n.recipientRole === 'all' ||
          !n.recipientRole
      );
      setNotifications(filtered);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [teacherUid]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => mapCategoryToFilter(n.category) === activeFilter);
  }, [notifications, activeFilter]);

  const handleExpand = async (notif: AppNotification) => {
    setExpandedId(expandedId === notif.id ? null : notif.id);
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
      } catch {
        toast.error('Failed to mark as read');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
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
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`text-lg font-extrabold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Announcements
            </h2>
            <p
              className={`text-xs font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {unreadCount > 0
                ? `${unreadCount} unread announcement${unreadCount > 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-black">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter
          className={`w-4 h-4 flex-shrink-0 ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`}
        />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-blue-500 text-white shadow-sm'
                : theme === 'dark'
                ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border animate-pulse h-20 ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
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
            <Megaphone className="w-6 h-6" />
          </div>
          <p
            className={`text-sm font-bold ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            No announcements found
          </p>
          <p
            className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {activeFilter === 'all'
              ? 'When administrators publish announcements, they will appear here.'
              : 'No announcements in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const isExpanded = expandedId === notif.id;
            return (
              <div
                key={notif.id}
                onClick={() => handleExpand(notif)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  !notif.isRead
                    ? theme === 'dark'
                      ? 'bg-blue-500/5 border-blue-500/30 shadow-sm'
                      : 'bg-blue-50 border-blue-500/30 shadow-sm'
                    : theme === 'dark'
                    ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border flex-shrink-0 ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm font-extrabold truncate ${
                          !notif.isRead
                            ? theme === 'dark'
                              ? 'text-white'
                              : 'text-slate-900'
                            : theme === 'dark'
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        {isExpanded ? (
                          <ChevronUp
                            className={`w-4 h-4 ${
                              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          />
                        ) : (
                          <ChevronDown
                            className={`w-4 h-4 ${
                              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-2'
                      } ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {notif.description}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`flex items-center gap-1 text-[10px] font-semibold ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatDate(notif.createdAt)}
                      </span>
                      {notif.senderName && (
                        <span
                          className={`text-[10px] font-bold ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}
                        >
                          {notif.senderName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
