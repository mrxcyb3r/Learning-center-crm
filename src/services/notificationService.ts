import { demoData } from './demoData';

// Types (define inline or import from demoData)
interface NotificationData {
  title: string;
  description: string;
  category: 'trial_lesson' | 'question' | 'payment' | 'attendance' | 'lead_created' | 'student_registered' | 'course_updated' | 'result_published' | 'announcement' | 'teacher_updated';
  recipientRole?: 'admin' | 'teacher' | 'all';
  recipientId?: string;
  groupId?: string;
  linkId?: string;
  senderName?: string;
}

interface ActivityData {
  type: string;
  message: string;
  icon: string;
  color: string;
  userId?: string;
}

/**
 * Website → admin Telegram notifications are sent SERVER-SIDE only.
 *
 * The browser never holds the bot token or the admin chat id (dead code here
 * was compiled to {} by Vite). Instead the site persists the inquiry to
 * Firestore (unchanged), then best-effort calls the server endpoint which
 * formats and dispatches via the server formatter. A notification failure can
 * never fail the form — the Firestore write is already done.
 */
async function notifyServerInquiry(payload: {
  kind: 'trial' | 'question';
  name: string;
  phone?: string;
  course?: string;
  message?: string;
}): Promise<void> {
  try {
    await fetch('/api/notify/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, source: 'website' }),
    });
  } catch {
    // Ignore — a Telegram outage must not fail the user's form submission.
  }
}

// Create a notification AND add to activity feed
export const notificationService = {
  // Create a notification AND add to activity feed
  notify(data: NotificationData): void {
    demoData.addNotification({
      title: data.title,
      description: data.description,
      category: data.category,
      recipientRole: data.recipientRole || 'admin',
      recipientId: data.recipientId,
      isRead: false,
      groupId: data.groupId,
      linkId: data.linkId,
      senderName: data.senderName,
    });
  },

  // Add to activity feed
  logActivity(data: ActivityData): void {
    demoData.addActivity({
      type: data.type,
      message: data.message,
      icon: data.icon,
      color: data.color,
      userId: data.userId,
    });
  },

  // Convenience methods for common scenarios

  // Send question notification to admin via server-side Telegram + demo data
  async onQuestionSubmitted(name: string, message: string, phone?: string, course?: string): Promise<void> {
    // Always save to demo data first (activity feed, etc.)
    this.notify({
      title: "Yangi savol qabul qilindi",
      description: `${name}: ${message}`,
      category: 'question',
      recipientRole: 'admin',
    });

    // Server-side Telegram notify (best-effort, never blocks the form)
    await notifyServerInquiry({ kind: 'question', name, phone, course, message });
  },

  // Send trial lesson notification to admin via server-side Telegram + demo data
  async onTrialLessonSubmitted(name: string, course: string, phone: string): Promise<void> {
    // Always save to demo data first
    this.notify({
      title: "Yangi sinov darsi arizasi",
      description: `${name} — ${course}. Tel: ${phone}`,
      category: 'trial_lesson',
      recipientRole: 'admin',
    });

    // Server-side Telegram notify (best-effort, never blocks the form)
    await notifyServerInquiry({ kind: 'trial', name, course, phone });
  },

  // Synchronous fallback (kept for backward compatibility)
  onQuestionSubmitted_sync(name: string, subject: string, course?: string): void {
    this.notify({
      title: "Yangi savol qabul qilindi",
      description: `${name}: ${subject}`,
      category: 'question',
      recipientRole: 'admin',
    });
    this.logActivity({
      type: 'question',
      message: `Yangi savol: ${name} — ${subject}`,
      icon: 'MessageCircle',
      color: 'purple',
    });
  },

  // Synchronous fallback (kept for backward compatibility)
  onTrialLessonSubmitted_sync(name: string, course: string, phone: string): void {
    this.notify({
      title: "Yangi sinov darsi arizasi",
      description: `${name} — ${course}. Tel: ${phone}`,
      category: 'trial_lesson',
      recipientRole: 'admin',
    });
    this.logActivity({
      type: 'trial_lesson',
      message: `Yangi sinov darsi arizasi: ${name} (${course})`,
      icon: 'CalendarPlus',
      color: 'blue',
    });
  },

  onPaymentRecorded(studentName: string, amount: number, teacherName?: string): void {
    this.notify({
      title: "To'lov qayd etildi",
      description: `${studentName} — ${amount.toLocaleString()} UZS`,
      category: 'payment',
      recipientRole: 'admin',
      senderName: teacherName,
    });
    this.logActivity({
      type: 'payment',
      message: `To'lov: ${studentName} — ${amount.toLocaleString()} UZS`,
      icon: 'DollarSign',
      color: 'emerald',
    });
  },

  onAttendanceUpdated(groupName: string, teacherName: string): void {
    this.logActivity({
      type: 'attendance',
      message: `${teacherName} davomadi yangiladi: ${groupName}`,
      icon: 'CheckSquare',
      color: 'amber',
    });
  },

  onLeadCreated(name: string, course: string, source: string): void {
    this.notify({
      title: "Yangi lead yaratildi",
      description: `${name} — ${course} (${source})`,
      category: 'lead_created',
      recipientRole: 'admin',
    });
    this.logActivity({
      type: 'lead',
      message: `Yangi lead: ${name} — ${course} (${source})`,
      icon: 'UserPlus',
      color: 'indigo',
    });
  },

  onStudentRegistered(name: string, course: string): void {
    this.notify({
      title: "Yangi o'quvchi ro'yxatdan o'tdi",
      description: `${name} — ${course}`,
      category: 'student_registered',
      recipientRole: 'admin',
    });
    this.logActivity({
      type: 'student',
      message: `Yangi o'quvchi: ${name} — ${course}`,
      icon: 'GraduationCap',
      color: 'emerald',
    });
  },

  onCourseUpdated(courseName: string): void {
    this.logActivity({
      type: 'course',
      message: `Kurs yangilandi: ${courseName}`,
      icon: 'BookOpen',
      color: 'blue',
    });
  },

  onResultPublished(studentName: string, score: string): void {
    this.notify({
      title: "Natija e'lon qilindi",
      description: `${studentName} — ${score}`,
      category: 'result_published',
      recipientRole: 'all',
    });
    this.logActivity({
      type: 'result',
      message: `Natija: ${studentName} — ${score}`,
      icon: 'Award',
      color: 'amber',
    });
  },

  onSettingsUpdated(settingName: string): void {
    this.logActivity({
      type: 'settings',
      message: `Sozlamalar yangilandi: ${settingName}`,
      icon: 'Settings',
      color: 'slate',
    });
  },

  onInquirySubmitted(name: string, category: string): void {
    this.notify({
      title: "Yangi so'rov qabul qilindi",
      description: `${name} — ${category}`,
      category: 'question',
      recipientRole: 'admin',
    });
    this.logActivity({
      type: 'inquiry',
      message: `Yangi so'rov: ${name} — ${category}`,
      icon: 'HelpCircle',
      color: 'purple',
    });
  },
};