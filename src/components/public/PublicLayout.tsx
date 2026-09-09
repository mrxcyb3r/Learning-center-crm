import React, { createContext, useContext, useState } from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { BookTrialModal } from './BookTrialModal';

// ---------------------------------------------------------------------------
// PublicLayout — shared chrome for all public pages: navbar, footer and the
// trial-booking modal, exposed to any page through useTrialModal().
// ---------------------------------------------------------------------------

interface TrialModalContextValue {
  openTrial: (courseName?: string) => void;
}

const TrialModalContext = createContext<TrialModalContextValue>({ openTrial: () => {} });

export const useTrialModal = () => useContext(TrialModalContext);

interface PublicLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, activePage }) => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedCourseForTrial, setSelectedCourseForTrial] = useState('DTM & Milliy Sertifikat');

  const openTrial = (courseName?: string) => {
    if (courseName) setSelectedCourseForTrial(courseName);
    setIsTrialModalOpen(true);
  };

  return (
    <TrialModalContext.Provider value={{ openTrial }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
        <PublicNavbar activePage={activePage} onOpenTrialModal={() => openTrial()} />
        <main>{children}</main>
        <PublicFooter />
        <BookTrialModal
          isOpen={isTrialModalOpen}
          onClose={() => setIsTrialModalOpen(false)}
          defaultCourse={selectedCourseForTrial}
        />
      </div>
    </TrialModalContext.Provider>
  );
};