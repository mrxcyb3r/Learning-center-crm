export interface StudentMockData {
  studentName: string;
  enrolledCourses: string[];
  overallBandScore: string;
  breakdownScores: {
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
  };
  attendanceRate: string;
  recentAssignments: Array<{
    id: string;
    title: string;
    type: string;
    status: 'Graded' | 'Pending' | 'Submitted';
    score?: string;
    feedback?: string;
  }>;
}

export interface TeacherMockData {
  teacherName: string;
  specialization: string;
  activeClassesCount: number;
  pendingEssaysCount: number;
  classesToday: Array<{
    id: string;
    courseTitle: string;
    room: string;
    time: string;
    studentCount: number;
  }>;
}

export interface AdminMockData {
  activeStudentsTotal: number;
  monthlyRevenue: string;
  activeBranches: number;
  systemHealth: string;
  recentInquiries: Array<{
    id: string;
    name: string;
    phone: string;
    requestedCourse: string;
    status: 'new' | 'contacted' | 'enrolled';
  }>;
}

export interface AppMockDataSet {
  student: StudentMockData;
  teacher: TeacherMockData;
  admin: AdminMockData;
}

export const MOCK_APP_DATA: AppMockDataSet = {
  student: {
    studentName: "Alex Johnson (Guest Demo)",
    enrolledCourses: ["IELTS 7.5+ Intensive", "Python Cyber Basics"],
    overallBandScore: "7.5",
    breakdownScores: {
      listening: "8.0",
      reading: "8.5",
      writing: "7.0",
      speaking: "7.0"
    },
    attendanceRate: "96%",
    recentAssignments: [
      {
        id: "a1",
        title: "IELTS Task 1 Bar Chart Analysis",
        type: "Writing",
        status: "Graded",
        score: "7.5",
        feedback: "Great overview paragraph. Work on linking words in paragraph 2."
      },
      {
        id: "a2",
        title: "Python Data Structures Check-in",
        type: "Code",
        status: "Submitted",
        score: "Pending",
        feedback: "Awaiting automated test runner feedback."
      }
    ]
  },
  teacher: {
    teacherName: "Prof. Sarah Connor (Demo)",
    specialization: "IELTS Writing & Speaking",
    activeClassesCount: 4,
    pendingEssaysCount: 14,
    classesToday: [
      { id: "c1", courseTitle: "IELTS 7.5+ Intensive", room: "Room 301", time: "09:00 - 10:30", studentCount: 18 },
      { id: "c2", courseTitle: "Web Dev Full-Stack", room: "Lab 2", time: "11:00 - 12:30", studentCount: 15 }
    ]
  },
  admin: {
    activeStudentsTotal: 840,
    monthlyRevenue: "$18,500",
    activeBranches: 3,
    systemHealth: "99.9% Uptime",
    recentInquiries: [
      { id: "i1", name: "Dilshod Alimov", phone: "+998 90 123 45 67", requestedCourse: "IELTS Intensive", status: "new" },
      { id: "i2", name: "Malika Umarova", phone: "+998 91 987 65 43", requestedCourse: "Cybersecurity Basics", status: "contacted" }
    ]
  }
};
