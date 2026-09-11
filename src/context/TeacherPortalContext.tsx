import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getBusinessModel, setBusinessModel as saveBusinessModel } from '../config/business';
import {
  TeacherTab,
  BusinessModel,
  TeacherDashboardStats,
} from '../types/teacher';
import { Group, Student, Payment, AttendanceRecord } from '../types';
import { groupsService, studentsService, paymentsService, attendanceService, userService } from '../services/repository';

interface TeacherPortalContextType {
  teacherUid: string;
  teacherName: string;
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
  error: string | null;

  refresh: () => void;
}

const TeacherPortalContext = createContext<TeacherPortalContextType | undefined>(undefined);

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
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessModel, setBusinessModelState] = useState<BusinessModel>(getBusinessModel());
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const teacherUid = currentUser?.uid || '';
  const teacherName = currentUser?.displayName || 'Teacher';
  const teacherEmail = currentUser?.email || '';

  // Load teacher profile and verify role
  useEffect(() => {
    if (!currentUser || role !== 'teacher') return;

    let mounted = true;

    const loadTeacherData = async (): Promise<(() => void) | void> => {
      setIsLoading(true);
      setError(null);
      try {
        // Load groups for this teacher
        const teacherGroups = await groupsService.getGroupsByTeacher(teacherUid);
        if (!mounted) return;
        setGroups(teacherGroups);

        // Load students in these groups
        const groupIds = teacherGroups.map(g => g.id);
        if (groupIds.length > 0) {
          const teacherStudents = await studentsService.getStudentsByTeacher(teacherUid);
          if (!mounted) return;
          setStudents(teacherStudents);

          // Load payments for these students
          const teacherPayments = await paymentsService.getPaymentsByTeacher(teacherUid);
          if (!mounted) return;
          setPayments(teacherPayments);

          // Load attendance for these groups
          const teacherAttendance = await attendanceService.getAttendanceByTeacher(teacherUid);
          if (!mounted) return;
          setAttendance(teacherAttendance);
        }

        // Set up real-time listeners
        const unsubGroups = groupsService.subscribeToGroupsByTeacher(teacherUid, (newGroups) => {
          if (mounted) setGroups(newGroups);
        });

        const unsubStudents = studentsService.subscribeToStudentsByGroupIds(
          groupIds,
          (newStudents) => {
            if (mounted) setStudents(newStudents);
          }
        );

        const unsubAttendance = attendanceService.subscribeToAttendanceByGroupIds(
          groupIds,
          (newAttendance) => {
            if (mounted) setAttendance(newAttendance);
          }
        );

        return () => {
          unsubGroups();
          unsubStudents();
          unsubAttendance();
        };
      } catch (err: any) {
        console.error('Teacher data load error:', err);
        if (mounted) {
          setError('Ma\'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const cleanup = loadTeacherData();
    return () => {
      mounted = false;
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, [currentUser, role, teacherUid]);

  // Derive teacher-scoped data through relationships
  const myGroups = useMemo(() => groups, [groups]);
  const myStudents = useMemo(() => students, [students]);

  const stats = useMemo(
    () => computeStats(myGroups, myStudents, payments, attendance),
    [myGroups, myStudents, payments, attendance]
  );

  const setBusinessModelHandler = useCallback((model: BusinessModel) => {
    setBusinessModelState(model);
    saveBusinessModel(model);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    // Trigger re-fetch by updating a dependency
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
  }, []);

  return (
    <TeacherPortalContext.Provider
      value={{
        teacherUid,
        teacherName,
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
        error,
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