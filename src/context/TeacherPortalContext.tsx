import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { DEMO_MODE, DEMO_ACCOUNTS } from '../config/demo';
import { getBusinessModel, setBusinessModel as saveBusinessModel } from '../config/business';
import {
  TeacherTab,
  BusinessModel,
  TeacherDashboardStats,
  TeacherPayment,
  TeacherAnnouncement,
  TeacherTask,
  TeacherDocument,
} from '../types/teacher';
import { Group, Student, Payment, AttendanceRecord } from '../types';
import {
  subscribeGroups,
  subscribeStudents,
  subscribePayments,
  subscribeAttendance,
  subscribeNotifications,
  seedFirestoreIfEmpty,
} from '../services/firestore';

interface TeacherPortalContextType {
  teacherUid: string;
  teacherName: string;
  isDemoMode: boolean;
  businessModel: BusinessModel;
  setBusinessModel: (model: BusinessModel) => void;

  activeTab: TeacherTab;
  setActiveTab: (tab: TeacherTab) => void;

  groups: Group[];
  students: Student[];
  payments: Payment[];
  attendance: AttendanceRecord[];

  myGroups: Group[];
  myStudents: Student[];

  stats: TeacherDashboardStats;
  isLoading: boolean;

  refresh: () => void;
}

const TeacherPortalContext = createContext<TeacherPortalContextType | undefined>(undefined);

function computeStats(
  groups: Group[],
  students: Student[],
  payments: Payment[],
  attendance: AttendanceRecord[],
  teacherUid: string
): TeacherDashboardStats {
  const myGroups = groups.filter((g) => g.teacherId === teacherUid || g.teacherName);
  const myStudentIds = new Set(
    students.filter((s) => myGroups.some((g) => g.id === s.groupId)).map((s) => s.id)
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthPayments = payments.filter(
    (p) => p.date?.startsWith(currentMonth) && myStudentIds.has(p.studentId)
  );

  const paidStudentIds = new Set(monthPayments.filter((p) => p.status === 'paid').map((p) => p.studentId));

  const myStudents = students.filter((s) => myGroups.some((g) => g.id === s.groupId));
  const paidCount = myStudents.filter((s) => s.paymentStatus === 'paid').length;
  const unpaidCount = myStudents.length - paidCount;

  const todayStr = now.toISOString().split('T')[0];
  const todayAttendance = attendance.filter(
    (a) => a.date === todayStr && myGroups.some((g) => g.id === a.groupId)
  );
  let totalPresent = 0;
  let totalMarks = 0;
  todayAttendance.forEach((a) => {
    Object.values(a.records).forEach((r) => {
      totalMarks++;
      if (typeof r === 'string' && r === 'present') totalPresent++;
      else if (typeof r === 'object' && r.status === 'present') totalPresent++;
    });
  });

  return {
    todayClasses: myGroups.length,
    upcomingClasses: myGroups.length,
    activeStudentCount: myStudents.length,
    activeGroupCount: myGroups.length,
    monthlyIncome: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    expectedIncome: myStudents.reduce((sum, s) => sum + (s.tuitionFee || 0), 0),
    outstandingBalance: myStudents
      .filter((s) => s.paymentStatus !== 'paid')
      .reduce((sum, s) => sum + (s.tuitionFee || 0), 0),
    paidStudentsCount: paidCount,
    unpaidStudentsCount: unpaidCount,
    attendanceRate: totalMarks > 0 ? Math.round((totalPresent / totalMarks) * 100) : 0,
  };
}

export const TeacherPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeRole, loginAsDemoUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [businessModel, setBusinessModelState] = useState<BusinessModel>(getBusinessModel());

  const isDemoMode = DEMO_MODE;
  const teacherUid = isDemoMode && !currentUser ? DEMO_ACCOUNTS.teacher.uid : currentUser?.uid || '';
  const teacherName = isDemoMode && !currentUser ? DEMO_ACCOUNTS.teacher.displayName : currentUser?.displayName || 'Teacher';

  useEffect(() => {
    if (DEMO_MODE && !currentUser && (activeRole === 'guest' || !activeRole)) {
      loginAsDemoUser('teacher').catch(() => {});
    }
  }, [currentUser, activeRole, loginAsDemoUser]);

  useEffect(() => {
    if (!DEMO_MODE && !currentUser) return;

    setIsLoading(true);
    seedFirestoreIfEmpty().catch(() => {});

    const unsub1 = subscribeGroups((data) => {
      setGroups(data);
      setIsLoading(false);
    });
    const unsub2 = subscribeStudents((data) => setStudents(data));
    const unsub3 = subscribePayments((data) => setPayments(data));
    const unsub4 = subscribeAttendance((data) => setAttendance(data));

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
      unsub4?.();
    };
  }, [currentUser, isDemoMode]);

  const myGroups = useMemo(
    () => groups.filter((g) => g.teacherId === teacherUid || (!g.teacherId && g.teacherName === teacherName)),
    [groups, teacherUid, teacherName]
  );

  const myStudents = useMemo(
    () => students.filter((s) => myGroups.some((g) => g.id === s.groupId)),
    [students, myGroups]
  );

  const stats = useMemo(
    () => computeStats(groups, students, payments, attendance, teacherUid),
    [groups, students, payments, attendance, teacherUid]
  );

  const setBusinessModelHandler = useCallback((model: BusinessModel) => {
    setBusinessModelState(model);
    saveBusinessModel(model);
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    seedFirestoreIfEmpty()
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <TeacherPortalContext.Provider
      value={{
        teacherUid,
        teacherName,
        isDemoMode,
        businessModel,
        setBusinessModel: setBusinessModelHandler,
        activeTab,
        setActiveTab,
        groups,
        students,
        payments,
        attendance,
        myGroups,
        myStudents,
        stats,
        isLoading,
        refresh,
      }}
    >
      {children}
    </TeacherPortalContext.Provider>
  );
};

export function useTeacherPortal(): TeacherPortalContextType {
  const ctx = useContext(TeacherPortalContext);
  if (!ctx) throw new Error('useTeacherPortal must be used within TeacherPortalProvider');
  return ctx;
}
