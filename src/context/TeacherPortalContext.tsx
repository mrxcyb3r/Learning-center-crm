import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DEMO_MODE, DEMO_ACCOUNTS } from '../config/demo';
import { getBusinessModel, setBusinessModel as saveBusinessModel } from '../config/business';
import {
  TeacherTab,
  BusinessModel,
  TeacherDashboardStats,
} from '../types/teacher';
import { Group, Student, Payment, AttendanceRecord } from '../types';
import { GroupScheduleItem, StudentRecord, IncomePaymentRecord } from '../types/crm';
import { subscribeAttendance, subscribeNotifications, seedFirestoreIfEmpty } from '../services/firestore';
import { crmService } from '../services/crmService';

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

// ── Type mapping: crmService → Teacher portal types ──

function mapScheduleToGroup(item: GroupScheduleItem): Group {
  return {
    id: item.id,
    name: item.groupName,
    courseType: item.course,
    teacherId: item.teacherId || '',
    teacherName: item.teacher,
    scheduleTime: item.time,
    room: item.room,
    activeStudentsCount: item.studentsCount,
    maxCapacity: item.maxCapacity,
    status: item.status,
  };
}

function mapStudentRecordToStudent(s: StudentRecord): Student {
  const statusMap: Record<string, 'paid' | 'pending' | 'overdue'> = {
    'Paid': 'paid',
    'Due': 'pending',
    'Overdue': 'overdue',
  };
  return {
    id: s.id,
    fullName: s.fullName || s.name || '',
    phone: s.phone,
    groupId: s.groupId || '',
    groupName: s.groupName || '',
    tuitionFee: s.monthlyFee || s.tuitionFee || 0,
    paymentStatus: statusMap[s.paymentStatus] || 'pending',
    lastPaymentDate: s.nextDueDate || '',
    subjectCategory: s.course,
    nextDueDate: s.nextDueDate,
    attendanceRate: s.attendanceRate,
  };
}

function mapPaymentToPortal(p: IncomePaymentRecord): Payment {
  const statusMap: Record<string, 'paid' | 'pending' | 'refunded'> = {
    'Completed': 'paid',
    'Pending': 'pending',
    'Voided': 'refunded',
  };
  return {
    id: p.id,
    studentId: p.studentId || '',
    studentName: p.studentName,
    amount: p.amount,
    paymentMethod: p.method,
    date: p.date,
    recordedBy: p.recordedBy || '',
    status: statusMap[p.status] || 'paid',
    cohortGroup: p.course,
    notes: p.notes,
  };
}

// ── Today's day-of-week filter (Uzbek) ──

const UZBEK_DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

function isGroupScheduledToday(daysField: string): boolean {
  const todayIdx = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const todayAbbr = UZBEK_DAYS[todayIdx];
  return daysField.toUpperCase().includes(todayAbbr.toUpperCase());
}

// ── Stats computation ──

function computeStats(
  myGroups: Group[],
  myStudents: Student[],
  payments: Payment[],
  attendance: AttendanceRecord[],
): TeacherDashboardStats {
  const todayClasses = myGroups.filter((g) => isGroupScheduledToday(g.scheduleTime || g.name)).length;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const myStudentIds = new Set(myStudents.map((s) => s.id));

  const monthPayments = payments.filter(
    (p) => p.date?.startsWith(currentMonth) && myStudentIds.has(p.studentId)
  );

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
    todayClasses,
    upcomingClasses: todayClasses,
    activeStudentCount: myStudents.length,
    activeGroupCount: myGroups.length,
    monthlyIncome: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    expectedIncome: myStudents.reduce((sum, s) => sum + (s.tuitionFee || 0), 0),
    outstandingBalance: myStudents
      .filter((s) => s.paymentStatus !== 'paid')
      .reduce((sum, s) => sum + (s.tuitionFee || 0), 0),
    paidStudentsCount: paidCount,
    unpaidStudentsCount: unpaidCount,
    attendanceRate: totalMarks > 0
      ? Math.round((totalPresent / totalMarks) * 100)
      : myStudents.length > 0
        ? Math.round(myStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / myStudents.length)
        : 0,
  };
}

// ── Provider ──

export const TeacherPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeRole, loginAsDemoUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [businessModel, setBusinessModelState] = useState<BusinessModel>(getBusinessModel());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const isDemoMode = DEMO_MODE;
  const teacherUid = isDemoMode && !currentUser ? DEMO_ACCOUNTS.teacher.uid : currentUser?.uid || '';
  const teacherName = isDemoMode && !currentUser ? DEMO_ACCOUNTS.teacher.displayName : currentUser?.displayName || 'Teacher';

  useEffect(() => {
    if (DEMO_MODE && !currentUser && (activeRole === 'guest' || !activeRole)) {
      loginAsDemoUser('teacher').catch(() => {});
    }
  }, [currentUser, activeRole, loginAsDemoUser]);

  // Resolve teacher identity from crmService
  const resolvedTeacher = useMemo(() => {
    return crmService.getTeacherByUid(teacherUid) || crmService.getTeacherByName(teacherName);
  }, [teacherUid, teacherName]);

  const resolvedTeacherId = resolvedTeacher?.id || teacherUid;
  const resolvedTeacherName = resolvedTeacher?.name || teacherName;

  // Load core data from crmService (same source as Admin ERP)
  const groups = useMemo(() => {
    return crmService.getSchedule().map(mapScheduleToGroup);
  }, []);

  const students = useMemo(() => {
    return crmService.getStudents().map(mapStudentRecordToStudent);
  }, []);

  const payments = useMemo(() => {
    return crmService.getPayments().map(mapPaymentToPortal);
  }, []);

  // Subscribe to Firestore for attendance (only source of attendance records)
  useEffect(() => {
    if (!DEMO_MODE && !currentUser) return;
    const unsub = subscribeAttendance((data) => setAttendance(data));
    return () => unsub?.();
  }, [currentUser, isDemoMode]);

  // Seed Firestore for teacher-specific features (tasks, documents, notifications)
  useEffect(() => {
    if (!DEMO_MODE && !currentUser) return;
    seedFirestoreIfEmpty().catch(() => {});
  }, [currentUser, isDemoMode]);

  // Derive teacher-scoped data through relationships
  const myGroups = useMemo(
    () => groups.filter((g) => g.teacherId === resolvedTeacherId || g.teacherName === resolvedTeacherName),
    [groups, resolvedTeacherId, resolvedTeacherName]
  );

  const myStudents = useMemo(
    () => students.filter((s) => myGroups.some((g) => g.id === s.groupId)),
    [students, myGroups]
  );

  const stats = useMemo(
    () => computeStats(myGroups, myStudents, payments, attendance),
    [myGroups, myStudents, payments, attendance]
  );

  const isLoadingState = useMemo(() => {
    return groups.length === 0 && students.length === 0;
  }, [groups, students]);

  useEffect(() => {
    setIsLoading(isLoadingState);
  }, [isLoadingState]);

  const setBusinessModelHandler = useCallback((model: BusinessModel) => {
    setBusinessModelState(model);
    saveBusinessModel(model);
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  return (
    <TeacherPortalContext.Provider
      value={{
        teacherUid,
        teacherName: resolvedTeacherName,
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
