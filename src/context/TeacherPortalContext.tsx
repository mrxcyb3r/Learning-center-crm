import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getBusinessModel, setBusinessModel as saveBusinessModel } from '../config/business';
import {
  TeacherTab,
  BusinessModel,
  TeacherDashboardStats,
} from '../types/teacher';
import { Group, Student, Payment, AttendanceRecord, Assignment } from '../types';
import { groupsService, studentsService, paymentsService, attendanceService, homeworkService, userService } from '../services/repository';

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
  homework: Assignment[];

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
  const { currentUser, role, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessModel, setBusinessModelState] = useState<BusinessModel>(getBusinessModel());
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [homework, setHomework] = useState<Assignment[]>([]);

  // Teacher identity is the stable Firebase UID. Email strings are never used
  // for data matching — all scoping goes through `teacherId == uid`.
  const teacherUid = currentUser?.uid || '';
  const teacherName =
    currentUser?.displayName || userProfile?.displayName || userProfile?.fullName || 'Teacher';

  // Load teacher profile and verify role
  useEffect(() => {
    if (!currentUser || role !== 'teacher') return;

    let mounted = true;

    // Canonical index-driven load. Firestore rejects LIST queries it cannot
    // prove authorized, so every read below addresses known IDs from the
    // teacher's assignment index (users/{uid}.assignedGroupIds) and the
    // groups' membership indexes — never whole-collection scans.
    const loadTeacherData = async (): Promise<(() => void) | void> => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Authorized index from the teacher's own profile.
        const profile = await userService.getUserProfile(teacherUid);
        const assignedGroupIds = profile?.assignedGroupIds ?? [];
        if (!mounted) return;

        // 2. Groups by ID (per-doc reads; unauthorized/missing docs skipped).
        const teacherGroups = await groupsService.getGroupsByIds(assignedGroupIds);
        if (!mounted) return;
        setGroups(teacherGroups);
        const groupIds = teacherGroups.map(g => g.id);

        // 3. Students via the groups' membership indexes.
        const studentIds = teacherGroups.flatMap(g => g.studentIds ?? []);
        const teacherStudents = await studentsService.getStudentsByIds(studentIds);
        if (!mounted) return;
        setStudents(teacherStudents);

        // 4. Attendance via deterministic `{groupId}_{date}` IDs (30-day window).
        const recordIds = groupIds.flatMap(gid =>
          attendanceService.attendanceWindowIds(gid, 30)
        );
        const teacherAttendance = await attendanceService.getAttendanceByIds(recordIds);
        if (!mounted) return;
        setAttendance(teacherAttendance);

        // 5. Homework via the groups' homework indexes.
        const homeworkIds = teacherGroups.flatMap(g => g.homeworkIds ?? []);
        try {
          const teacherHomework = await homeworkService.getHomeworkByIds(homeworkIds);
          if (!mounted) return;
          setHomework(teacherHomework);
        } catch {
          if (mounted) setHomework([]);
        }

        // 6. Payments have no per-teacher index; attempt the scoped query and
        // degrade to empty on denial (never mock data, never broad reads).
        try {
          const teacherPayments = await paymentsService.getPaymentsByTeacher(teacherUid);
          if (!mounted) return;
          setPayments(teacherPayments);
        } catch {
          if (mounted) setPayments([]);
        }

        // Realtime listeners on known authorized IDs only.
        const unsubGroups = groupsService.subscribeToGroupsByIds(groupIds, (newGroups) => {
          if (mounted) setGroups(newGroups);
        });
        const unsubStudents = studentsService.subscribeToStudentsByIds(studentIds, (newStudents) => {
          if (mounted) setStudents(newStudents);
        });

        return () => {
          unsubGroups();
          unsubStudents();
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

    // loadTeacherData is async and resolves with an optional unsubscribe
    // function. Store it when it arrives; the effect cleanup uses the stored
    // value instead of calling the promise itself.
    let unsubscribe: (() => void) | void;
    loadTeacherData().then((cleanup) => {
      if (typeof cleanup === 'function') {
        if (mounted) {
          unsubscribe = cleanup;
        } else {
          cleanup();
        }
      }
    });
    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
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
    if (!currentUser || role !== 'teacher') return;
    setIsLoading(true);
    try {
      const profile = await userService.getUserProfile(teacherUid);
      const assignedGroupIds = profile?.assignedGroupIds ?? [];
      const teacherGroups = await groupsService.getGroupsByIds(assignedGroupIds);
      setGroups(teacherGroups);
      const studentIds = teacherGroups.flatMap(g => g.studentIds ?? []);
      setStudents(await studentsService.getStudentsByIds(studentIds));
      const recordIds = teacherGroups.flatMap(g =>
        attendanceService.attendanceWindowIds(g.id, 30)
      );
      setAttendance(await attendanceService.getAttendanceByIds(recordIds));
      const homeworkIds = teacherGroups.flatMap(g => g.homeworkIds ?? []);
      try {
        setHomework(await homeworkService.getHomeworkByIds(homeworkIds));
      } catch {
        setHomework([]);
      }
      try {
        setPayments(await paymentsService.getPaymentsByTeacher(teacherUid));
      } catch {
        setPayments([]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Teacher refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, role, teacherUid]);

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
        homework,
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