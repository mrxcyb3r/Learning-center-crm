import { demoData } from './demoData';

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: string;
  color: string;
  timeAgo: string; // computed
}

export const activityService = {
  getRecentActivity(limit: number = 20): ActivityItem[] {
    const items = demoData.getActivity(limit);
    return items.map(item => ({
      ...item,
      timeAgo: this.getTimeAgo(item.timestamp),
    }));
  },

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hozirgina';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays < 7) return `${diffDays} kun oldin`;
    return then.toLocaleDateString('uz-UZ');
  },

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('uz-UZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },
};
