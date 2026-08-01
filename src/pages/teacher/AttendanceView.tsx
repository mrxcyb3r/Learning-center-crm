import React from 'react';
import { AttendanceManager } from '../../components/teacher/AttendanceManager';

export const AttendanceView: React.FC<{ initialGroupId?: string }> = ({ initialGroupId }) => {
  return <AttendanceManager initialGroupId={initialGroupId} />;
};

export default AttendanceView;
