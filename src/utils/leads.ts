export const LEAD_STATUS_MAP: Record<string, string> = {
  'Yangi': 'New',
  "Bog'lanildi": 'Contacted',
  'Sinov darsi belgilandi': 'Trial Scheduled',
  'Sinov darsi yakunlandi': 'Trial Completed',
  "O'quvchiga aylandi": 'Enrolled',
  "Yo'qotildi": 'Lost',
};

export function normalizeLeadStatus(status: string): string {
  return LEAD_STATUS_MAP[status] || status;
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  New: 'Yangi',
  Contacted: "Bog'lanildi",
  'Trial Scheduled': 'Sinov darsi belgilandi',
  'Trial Completed': 'Sinov darsi yakunlandi',
  Enrolled: "O'quvchiga aylandi",
  Lost: "Yo'qotildi",
};

const LEAD_STATUS_LABELS_EN: Record<string, string> = {
  New: 'New',
  Contacted: 'Contacted',
  'Trial Scheduled': 'Trial Scheduled',
  'Trial Completed': 'Trial Completed',
  Enrolled: 'Enrolled',
  Lost: 'Lost',
};

const LEAD_STATUS_LABELS_RU: Record<string, string> = {
  New: 'Новые',
  Contacted: 'Связались',
  'Trial Scheduled': 'Пробный',
  'Trial Completed': 'Посетили',
  Enrolled: 'Ученики',
  Lost: 'Потеряны',
};

export function leadStatusLabel(normalizedStatus: string, lang?: string): string {
  if (lang === 'EN') return LEAD_STATUS_LABELS_EN[normalizedStatus] || normalizedStatus;
  if (lang === 'RU') return LEAD_STATUS_LABELS_RU[normalizedStatus] || normalizedStatus;
  return LEAD_STATUS_LABELS[normalizedStatus] || normalizedStatus;
}