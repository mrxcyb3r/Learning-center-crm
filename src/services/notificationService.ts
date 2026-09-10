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
  onTrialLessonSubmitted(name: string, course: string, phone: string): void {
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

  onQuestionSubmitted(name: string, subject: string, course?: string): void {
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
