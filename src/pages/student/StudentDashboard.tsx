import React from 'react';
import { StudentDashboardView } from '../../components/Dashboard/Dashboard';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface StudentDashboardProps {
  onNavigate?: (tab: string) => void;
  showToast?: (msg: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate, showToast: externalShowToast }) => {
  const { language } = useLanguage();
  const { userProfile, currentUser } = useAuth();
  const isUz = language === 'UZ';
  const displayName = userProfile?.displayName || currentUser?.displayName || 'Student';

  const showToast = externalShowToast || ((msg: string) => {
    console.log('[Toast]', msg);
  });

  return (
    <StudentDashboardView
      isUz={isUz}
      displayName={displayName}
      showToast={showToast}
      onNavigate={onNavigate}
    />
  );
};

export default StudentDashboard;
