export interface BotStatusResponse {
  isConnected: boolean;
  telegramUsername?: string;
  chatId?: string;
  chatConnectedAt?: string;
}

export interface NotifyGradePayload {
  studentUid: string;
  title: string;
  score: string;
  feedback?: string;
  teacherName?: string;
}

export interface AssignPinPayload {
  userUid: string;
  pin: string;
}

export const BOT_USERNAME = 'centerflow_bot';

export function getBotDeepLink(userUid: string): string {
  return `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(userUid)}`;
}

export async function checkBotStatus(userUid: string): Promise<BotStatusResponse> {
  try {
    const response = await fetch(`/api/bot/status/${encodeURIComponent(userUid)}`);
    if (!response.ok) {
      return { isConnected: false };
    }
    const data = await response.json();
    return {
      isConnected: Boolean(data.isConnected),
      telegramUsername: data.telegramUsername,
      chatId: data.chatId,
      chatConnectedAt: data.chatConnectedAt
    };
  } catch (error) {
    console.warn('Error checking Telegram bot status:', error);
    return { isConnected: false };
  }
}

export async function assignUserPin(userUid: string, pin: string): Promise<boolean> {
  try {
    const response = await fetch('/api/bot/assign-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userUid, pin })
    });
    return response.ok;
  } catch (error) {
    console.error('Error assigning PIN via Telegram service:', error);
    return false;
  }
}

export async function sendGradeNotification(payload: NotifyGradePayload): Promise<boolean> {
  try {
    const response = await fetch('/api/bot/notify-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending grade notification via Telegram service:', error);
    return false;
  }
}
