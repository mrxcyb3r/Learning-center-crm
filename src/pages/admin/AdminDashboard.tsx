import React from 'react';
import { DashboardView } from '../../components/erp/DashboardView';

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

/**
 * Legacy compatibility wrapper.
 *
 * NOTE: this component is NOT mounted by any current route — the live admin
 * dashboard is `DashboardView`, rendered by `CenterErpApp` under `/app`.
 * This wrapper exists so any external/legacy caller of `AdminDashboard`
 * renders the same honest, business-first dashboard instead of the removed
 * duplicate implementation (which used mock-data fallbacks, fabricated
 * chart values, external image hosts and developer-facing auth details).
 *
 * Legacy tab ids are mapped onto the real ERP navigation tabs.
 */
const LEGACY_TAB_MAP: Record<string, string> = {
  payments: 'payments',
  students: 'students',
  classes: 'schedule',
  schedule: 'schedule',
  inquiries: 'leads',
  leads: 'leads',
  landing: 'cms',
  cms: 'cms',
  reports: 'reports',
  teachers: 'teachers',
  settings: 'settings',
  telegram: 'telegram',
  expenses: 'expenses',
  courses: 'courses',
  murojaatlar: 'murojaatlar',
  receptionist: 'receptionist',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const handleNavigate = (tab: string) => {
    onNavigate?.(LEGACY_TAB_MAP[tab] ?? tab);
  };

  return <DashboardView onNavigateTab={handleNavigate} />;
};

export default AdminDashboard;
