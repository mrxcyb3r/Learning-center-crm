import React from 'react';
import { TeacherAttendance } from '../TeacherAttendance';

export const AttendanceView: React.FC<{ initialGroupId?: string }> = ({ initialGroupId }) => {
  return <TeacherAttendance initialGroupId={initialGroupId} />;
};

export default AttendanceView;
