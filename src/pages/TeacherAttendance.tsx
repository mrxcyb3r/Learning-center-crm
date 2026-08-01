import React from 'react';
import { AttendanceManager } from '../components/teacher/AttendanceManager';

export const TeacherAttendance: React.FC<{ initialGroupId?: string }> = ({ initialGroupId }) => {
  return <AttendanceManager initialGroupId={initialGroupId} />;
};

export default TeacherAttendance;
