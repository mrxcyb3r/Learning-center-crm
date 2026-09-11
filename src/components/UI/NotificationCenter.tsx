import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  FileText,
  CheckCircle2,
  Award,
  Megaphone,
  Clock,
  Sparkles,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/firestore';
import { AppNotification } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { language } = useLanguage();
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const activeRole = userProfile?.role || 'student';

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const unsubscribe = subscribeNotifications(
      currentUser?.uid,
      activeRole,
      (data) => {
        console.debug('Notifications drawer update:', data.length);
        setNotifications(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentUser?.uid, activeRole]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    if (onNavigate) {
      if (notif.category === 'assignment_created' || notif.category === 'submission_received') {
        onNavigate('group_feed');
      } else if (notif.category === 'grade_published') {
        onNavigate('gradebook');
      } else {
        onNavigate('group_feed');
      }
    }
    onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(notifications);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return t("Hozirgincha", "Just now", "Только что");
      if (diffMins < 60) return `${diffMins} ${t("daq oldin", "m ago", "мин назад")}`;
      if (diffHours < 24) return `${diffHours} ${t("soat oldin", "h ago", "ч назад")}`;
      if (diffDays < 7) return `${diffDays} ${t("kun oldin", "d ago", "дн назад")}`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assignment_created':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'submission_received':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'grade_published':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'announcement':
      default:
        return <Megaphone className="w-4 h-4 text-rose-500" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'assignment_created':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'submission_received':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'grade_published':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'announcement':
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t("Bildirishnomalar Markazi", "Notification Center", "Центр Уведомлений")}</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                      {unreadCount} {t("yangi", "new", "новые")}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("Vazifalar, baholar va e'lonlar haqida bildirishnomalar", "Real-time updates on assignments & grades", "Уведомления о заданиях, оценках и новостях")}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Sub-header */}
          {notifications.length > 0 && (
            <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {notifications.length} {t("ta xabar", "total messages", "всего сообщений")}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t("Barchasini o'qilgan deb belgilash", "Mark all as read", "Прочитать все")}</span>
                </button>
              )}
            </div>
          )}

          {/* Notification List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse h-20 border border-slate-200 dark:border-slate-800"
                  />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("Hozircha bildirishnomalar mavjud emas", "No notifications right now", "Пока нет уведомлений")}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {t(
                    "O'qituvchingiz yangi vazifa berganda yoki baholaganda xabarlar shu yerda paydo bo'ladi.",
                    "When new assignments or grades are published, updates will appear here.",
                    "Новые задания и оценки будут появляться здесь."
                  )}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative group flex items-start gap-3.5 ${
                    !notif.isRead
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  {/* Category Icon */}
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${getCategoryBadgeClass(
                      notif.category
                    )}`}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-xs font-extrabold truncate ${
                          !notif.isRead
                            ? 'text-slate-900 dark:text-white font-black'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                      </span>
                      {notif.senderName && (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {notif.senderName}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition self-center shrink-0" />
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>CenterFlow Real-Time Synchronized Drawer</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
