import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useAppData } from '../context/AppDataContext';
import { AnimatedBanner } from './AnimatedBanner';
import { User, LogOut, Award, CheckCircle, BookOpen, Users, DollarSign, Activity, FileText } from 'lucide-react';

interface AnimatedDashboardViewProps {
  onOpenAuth: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const }
  }
};

export const AnimatedDashboardView: React.FC<AnimatedDashboardViewProps> = ({ onOpenAuth }) => {
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="rounded-full h-8 w-8 border-b-2 border-amber-500"
        />
      </div>
    );
  }

  const activeRoleDisplay = isGuest ? demoPreviewRole : userRole;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* DEMO BANNER FOR GUESTS / AUTH BAR */}
        {isGuest ? (
          <AnimatedBanner
            isVisible={true}
            demoPreviewRole={demoPreviewRole}
            onSelectRole={(role) => setDemoPreviewRole(role as 'student' | 'teacher' | 'admin')}
            onOpenAuth={onOpenAuth}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Logged in as Production {userRole.toUpperCase()}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logoutUser}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </motion.button>
          </motion.div>
        )}

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-black text-white capitalize flex items-center gap-2">
              <span>{activeRoleDisplay} Workspace</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isGuest
                ? "Interactive mock representation of CenterFlow system interface."
                : "Live connection established via Firebase backend."}
            </p>
          </div>

          {/* QUICK SIMULATION BUTTON */}
          {isGuest && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loginUser("demo_user_123", demoPreviewRole)}
              className="text-[11px] font-bold text-slate-500 hover:text-amber-400 underline cursor-pointer"
            >
              [Dev Tool: Instant Login as {demoPreviewRole}]
            </motion.button>
          )}
        </motion.div>

        {/* ROLE SPECIFIC DASHBOARD CARDS WITH STAGGERED ANIMATIONS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoleDisplay}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {activeRoleDisplay === 'student' && (
              <>
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Overall IELTS Score</span>
                    <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {appData.overallBandScore || "7.5"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Updated from recent mock exam</div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-emerald-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Attendance Rate</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {appData.attendanceRate || "96%"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Excellent streak active</div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-indigo-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Enrolled Courses</span>
                    <BookOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1 line-clamp-2">
                    {(appData.enrolledCourses || ["IELTS Intensive 7.5+", "General English Fluency"]).join(", ")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Active trimester modules</div>
                </motion.div>
              </>
            )}

            {activeRoleDisplay === 'teacher' && (
              <>
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-indigo-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Active Classes</span>
                    <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-indigo-400">
                    {appData.activeClassesCount || 4}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Scheduled for this week</div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Pending Essays</span>
                    <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {appData.pendingEssaysCount || 12}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Requires grading feedback</div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-emerald-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Instructor Profile</span>
                    <User className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-lg font-black text-slate-200 mt-1">
                    {appData.teacherName || "Sarah Connor"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Head IELTS Instructor</div>
                </motion.div>
              </>
            )}

            {activeRoleDisplay === 'admin' && (
              <>
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-emerald-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Active Students</span>
                    <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {appData.activeStudentsTotal || 148}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">+14 enrolled this month</div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Monthly Revenue</span>
                    <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {appData.monthlyRevenue || "$18,450"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">92% collection completed</div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-indigo-500/40 transition-colors shadow-lg shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">System Status</span>
                    <Activity className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-black text-indigo-400">
                    {appData.systemHealth || "99.9%"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Firebase Firestore synchronized</div>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* RAW INSPECTOR */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl bg-gray-900 border border-gray-800 font-mono text-xs shadow-lg shadow-black/20"
        >
          <div className="text-slate-500 mb-2 font-sans font-bold flex items-center justify-between">
            <span>Resolved Data Payload JSON:</span>
            <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
              Real-time
            </span>
          </div>
          <pre className="text-slate-300 overflow-x-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {JSON.stringify(appData, null, 2)}
          </pre>
        </motion.div>

      </div>
    </div>
  );
};
