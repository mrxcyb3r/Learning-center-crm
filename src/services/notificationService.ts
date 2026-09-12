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

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  // If no bot token configured, skip Telegram sending (fallback mode)
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM] Bot token not configured, skipping Telegram send.');
    return false;
  }

  if (!chatId) {
    console.warn('[TELEGRAM] Chat ID missing, skipping Telegram send.');
    return false;
  }

  if (!text || text.length === 0) {
    console.warn('[TELEGRAM] Empty message text, skipping Telegram send.');
    return false;
  }

  try {
    // Use global fetch (available in Node.js 18+ and Vite build for Node targets)
    const tg = await fetch(`https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(text)}&disable_web_page_preview=true`, {
      method: 'POST',
    });
    const data = await tg.json().catch(() => ({}));
    const ok = tg.ok && data?.ok === true;
    if (!ok) {
      console.warn('[TELEGRAM] Failed to send message:', data?.description || 'Unknown error');
    }
    return ok;
  } catch (err: any) {
    console.error('[TELEGRAM] Error sending message:', err?.message || err);
    return false;
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

  // Send question notification to admin via Telegram + demo data
  async onQuestionSubmitted(name: string, subject: string, course?: string): Promise<void> {
    // Always save to demo data first (activity feed, etc.)
    this.notify({
      title: "Yangi savol qabul qilindi",
      description: `${name}: ${subject}`,
      category: 'question',
      recipientRole: 'admin',
    });

    // Try to send Telegram notification (won't break if unavailable)
    if (TELEGRAM_ADMIN_CHAT_ID) {
      const telegramText = `🔔 YANGI SAVOL\n\n👤 Ism: ${name}\n💬 Savol: ${subject}${
        course ? `\n📚 Kurs: ${course}` : ''
      }\n🕐 ${new Date().toLocaleString('uz-UZ')}`;

      // Fire and forget - don't await, don't break the form submission
      sendTelegramMessage(TELEGRAM_ADMIN_CHAT_ID, telegramText).catch(() => {
        // Swallow - Telegram failure should not break the app
      });
    }
  },

  // Send trial lesson notification to admin via Telegram + demo data
  async onTrialLessonSubmitted(name: string, course: string, phone: string): Promise<void> {
    // Always save to demo data first
    this.notify({
      title: "Yangi sinov darsi arizasi",
      description: `${name} — ${course}. Tel: ${phone}`,
      category: 'trial_lesson',
      recipientRole: 'admin',
    });

    // Try to send Telegram notification (won't break if unavailable)
    if (TELEGRAM_ADMIN_CHAT_ID) {
      const telegramText = `🔔 YANGI SINOV DARSI SO'ROVI\n\n👤 Ism: ${name}\n📞 Telefon: ${phone}\n📚 Kurs: ${course}\n🕐 ${new Date().toLocaleString('uz-UZ')}`;

      sendTelegramMessage(TELEGRAM_ADMIN_CHAT_ID, telegramText).catch(() => {
        // Swallow - Telegram failure should not break the app
      });
    }
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