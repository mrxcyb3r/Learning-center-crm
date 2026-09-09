import React, { useState } from 'react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { HeroSection } from '../components/public/HeroSection';
import { CoursesSection } from '../components/public/CoursesSection';
import { TeachersSection } from '../components/public/TeachersSection';
import { ResultsSection } from '../components/public/ResultsSection';
import { FaqSection } from '../components/public/FaqSection';
import { ContactSection } from '../components/public/ContactSection';
import { PublicFooter } from '../components/public/PublicFooter';
import { BookTrialModal } from '../components/public/BookTrialModal';

export const RenessansLandingPage: React.FC = () => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedCourseForTrial, setSelectedCourseForTrial] = useState('Tarix, Huquq, Geografiya');

  const handleOpenTrial = (courseName?: string) => {
    if (courseName) {
      setSelectedCourseForTrial(courseName);
    }
    setIsTrialModalOpen(true);
  };

  const handleScrollToCourses = () => {
    const el = document.getElementById('courses');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Fixed Conversion-Optimized Navbar */}
      <PublicNavbar onOpenTrialModal={() => handleOpenTrial('Tarix, Huquq, Geografiya')} />

      {/* Main Sections */}
      <main>
        <HeroSection
          onOpenTrialModal={handleOpenTrial}
          onScrollToCourses={handleScrollToCourses}
        />
        <CoursesSection onSelectCourseForTrial={handleOpenTrial} />
        <TeachersSection />
        <ResultsSection />
        <FaqSection />
        <ContactSection onOpenTrialModal={() => handleOpenTrial('Tarix, Huquq, Geografiya')} />
      </main>

      {/* Footer */}
      <PublicFooter />

      {/* Conversion Engine: Book Free Trial Modal */}
      <BookTrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        defaultCourse={selectedCourseForTrial}
      />
    </div>
  );
};
