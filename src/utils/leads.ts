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