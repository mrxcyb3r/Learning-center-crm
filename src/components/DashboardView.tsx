import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { ShieldAlert, Zap, LogOut, User } from 'lucide-react';

interface DashboardViewProps {
  onOpenAuth: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAuth }) => {
  const {
    isGuest,
    userRole,
    demoPreviewRole,
    setDemoPreviewRole,
    appData,
    loading,
    loginUser,
    logoutUser
  } = useAppData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const activeRoleDisplay = isGuest ? demoPreviewRole : userRole;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* DEMO BANNER FOR GUESTS */}
        {isGuest ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">Interactive Demo Mode Active</span>
                <span className="text-slate-400">You are exploring mock datasets. Log in to sync with your real account.</span>
              </div>
            </div>

            {/* DEMO ROLE SWITCHER TOGGLES */}
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 bg-gray-900 border border-gray-800 rounded-xl">
                {(['student', 'teacher', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setDemoPreviewRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                      demoPreviewRole === role
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Log In</span>
              </button>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED USER BAR */
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Logged in as Production {userRole.toUpperCase()}</span>
            </div>
            <button
              onClick={logoutUser}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white capitalize">
              {activeRoleDisplay} Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isGuest ? "Mock representation of live system interface." : "Live connection established via Firebase."}
            </p>
          </div>

          {/* QUICK SIMULATION BUTTON (FOR TESTING LOGIN IN DEV) */}
          {isGuest && (
            <button
              onClick={() => loginUser("demo_user_123", demoPreviewRole)}
              className="text-[11px] font-bold text-slate-500 hover:text-amber-400 underline cursor-pointer"
            >
              [Dev Tool: Instant Login as {demoPreviewRole}]
            </button>
          )}
        </div>

        {/* ROLE SPECIFIC DASHBOARD CARDS */}
        {activeRoleDisplay === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Overall IELTS Score</div>
              <div className="text-3xl font-black text-amber-400">{appData.overallBandScore || "7.5"}</div>
            </div>
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Attendance Rate</div>
              <div className="text-3xl font-black text-emerald-400">{appData.attendanceRate || "96%"}</div>
            </div>
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Enrolled Courses</div>
              <div className="text-sm font-bold text-slate-200 mt-2">
                {(appData.enrolledCourses || []).join(", ")}
              </div>
            </div>
          </div>
        )}

        {activeRoleDisplay === 'teacher' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Active Classes</div>
              <div className="text-3xl font-black text-indigo-400">{appData.activeClassesCount || 0}</div>
            </div>
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Pending Essays</div>
              <div className="text-3xl font-black text-amber-400">{appData.pendingEssaysCount || 0}</div>
            </div>
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Instructor</div>
              <div className="text-sm font-bold text-slate-200 mt-2">{appData.teacherName || "Sarah Connor"}</div>
            </div>
          </div>
        )}

        {activeRoleDisplay === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Active Students</div>
              <div className="text-3xl font-black text-emerald-400">{appData.activeStudentsTotal || 0}</div>
            </div>
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">Monthly Revenue</div>
              <div className="text-3xl font-black text-amber-400">{appData.monthlyRevenue || "$0"}</div>
            </div>
            <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
              <div className="text-xs font-bold text-slate-400 mb-1">System Status</div>
              <div className="text-3xl font-black text-indigo-400">{appData.systemHealth || "100%"}</div>
            </div>
          </div>
        )}

        {/* RAW INSPECTOR */}
        <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 font-mono text-xs">
          <div className="text-slate-500 mb-2 font-sans font-bold">Resolved Data Payload JSON:</div>
          <pre className="text-slate-300 overflow-x-auto">
            {JSON.stringify(appData, null, 2)}
          </pre>
        </div>

      </div>
    </div>
  );
};
