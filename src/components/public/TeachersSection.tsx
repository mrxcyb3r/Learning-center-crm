import React from 'react';
import { motion } from 'motion/react';
import { Award, Briefcase, GraduationCap, CheckCircle2, Phone, Send } from 'lucide-react';
import { TeacherRecord } from '../../types/crm';
import { INITIAL_TEACHERS } from '../../services/crmService';

interface TeachersSectionProps {
  teachers?: TeacherRecord[];
}

export const TeachersSection: React.FC<TeachersSectionProps> = ({
  teachers = INITIAL_TEACHERS,
}) => {
  return (
    <section id="teachers" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Tajribali Mutaxassislar
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Bizning Ustozlarimiz
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            Milliy sertifikat va DTM imtihonlarida yuzlab o'quvchilarni talabalikka yetaklagan professional pedagoglar.
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {teachers.map((teacher, idx) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Photo & Badge Area */}
              <div>
                <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={teacher.photo}
                    alt={teacher.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Experience Badge */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      {teacher.experience}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold">
                      {teacher.studentsCount}+ O'quvchi
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {teacher.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    {teacher.subject || teacher.specialization}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {teacher.description || teacher.specialization}
                  </p>

                  {/* Achievements List */}
                  {teacher.achievements && teacher.achievements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {teacher.achievements.map((ach, aIdx) => (
                        <div key={aIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ach}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  {teacher.activeGroups} ta faol guruh
                </span>
                {teacher.telegram ? (
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {teacher.telegram}
                  </span>
                ) : (
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {teacher.phone}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
