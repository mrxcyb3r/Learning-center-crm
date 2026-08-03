import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TelegramSettingsCard } from './TelegramSettingsCard';
import { TelegramAdminPanel } from './admin/TelegramAdminPanel';

export interface TelegramPanelProps {
  userUid?: string;
  className?: string;
}

/**
 * Modular Telegram Integration Interface
 * Adapts dynamically based on the logged-in user's role:
 * - Admin / SuperAdmin: Privileged Management Suite (Bot Health, User Lookup & PINs, Global Broadcast)
 * - Student / Parent / Teacher: Personal Notification Center (Bot Status, Connect Link, Verified Badge)
 */
export const TelegramPanel: React.FC<TelegramPanelProps> = ({ userUid, className = '' }) => {
  const { activeRole, role } = useAuth();
  const currentRole = activeRole || role;
  const isAdmin = currentRole === 'admin' || currentRole === 'superadmin';

  if (isAdmin) {
    return <TelegramAdminPanel />;
  }

  return <TelegramSettingsCard userUid={userUid} className={className} />;
};

export default TelegramPanel;
