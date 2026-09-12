/**
 * Centralized, server-side notification formatting for the CenterFlow CRM.
 *
 * Every "new inquiry" notification (Telegram trial, Telegram question, website
 * trial, website question) is rendered here so the vocabulary stays consistent
 * with the Murojaatlar inbox:  Sayt / Telegram  •  Sinov darsi / Savol.
 *
 * Never receives secrets: this module only formats free-form inquiry fields
 * (name/phone/course/message) — bot token and webhook secret stay in
 * telegramService.ts, the admin chat id stays server-side only.
 */

export interface InquiryNotificationInput {
  kind: 'trial' | 'question';
  source: 'website' | 'telegram';
  name?: string;
  phone?: string;
  username?: string;
  course?: string;
  message?: string;
  createdAt?: string;
}

const MAX_MESSAGE_LENGTH = 400;

function sourceLabel(source: InquiryNotificationInput['source']): string {
  return source === 'telegram' ? 'Telegram' : 'Sayt';
}

function kindLabel(kind: InquiryNotificationInput['kind']): string {
  return kind === 'trial' ? 'Sinov darsi' : 'Savol';
}

function displayName(input: InquiryNotificationInput): string {
  const name = (input.name || '').trim();
  if (name) return name;
  return input.source === 'telegram' ? 'Telegram foydalanuvchisi' : 'Ism kiritilmagan';
}

function formatStamp(iso?: string): string {
  let value: string;
  if (iso) {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) value = iso;
    else value = new Date().toISOString();
  } else {
    value = new Date().toISOString();
  }
  return new Date(value).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateMessage(message?: string): string {
  const raw = (message || '').trim();
  if (!raw) return '';
  const body = raw.length > MAX_MESSAGE_LENGTH ? raw.slice(0, MAX_MESSAGE_LENGTH - 1) + '…' : raw;
  return `\n💬 "${body}"`;
}

export function formatInquiryNotification(input: InquiryNotificationInput): string {
  const lines: string[] = [];
  const stamp = formatStamp(input.createdAt);

  if (input.kind === 'question') {
    lines.push('📩 Yangi murojaat');
    lines.push('');
    lines.push(`${sourceLabel(input.source)} • ${kindLabel('question')}`);
    lines.push('');
    lines.push(`👤 ${displayName(input)}`);
    if (input.username) lines.push(`📱 @${String(input.username).replace(/^@/, '')}`);
    else if (input.phone) lines.push(`📞 ${input.phone}`);
    const message = truncateMessage(input.message);
    if (message) lines.push(message.trim());
    lines.push('');
    lines.push(`🕐 ${stamp}`);
    return lines.join('\n');
  }

  // Trial application
  lines.push('📚 Yangi sinov darsi arizasi');
  lines.push('');
  lines.push(sourceLabel(input.source));
  lines.push('');
  lines.push(`👤 ${displayName(input)}`);
  if (input.phone) lines.push(`📞 ${input.phone}`);
  if (input.username) lines.push(`📱 @${String(input.username).replace(/^@/, '')}`);
  if (input.course) lines.push(`📖 ${input.course}`);
  lines.push('');
  lines.push(`🕐 ${stamp}`);
  return lines.join('\n');
}

/** No duplicated username/ID fields: a phone or username is shown once. */
export function formatAdminNotification(input: InquiryNotificationInput): string {
  return formatInquiryNotification(input);
}