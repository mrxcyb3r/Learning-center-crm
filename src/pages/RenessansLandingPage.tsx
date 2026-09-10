import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicLayout, useTrialModal } from '../components/public/PublicLayout';
import { HeroSection } from '../components/public/HeroSection';
import { CoursesSection } from '../components/public/CoursesSection';
import { TeachersSection } from '../components/public/TeachersSection';
import { ResultsSection } from '../components/public/ResultsSection';
import { FaqSection } from '../components/public/FaqSection';
import { QuestionSection } from '../components/public/QuestionSection';
import { ContactSection } from '../components/public/ContactSection';
import { SEOHead } from '../components/SEOHead';
import { getSiteUrl } from '../utils/content';

export const RenessansLandingPage: React.FC = () => {
  const { openTrial } = useTrialModal();
  const [searchParams] = useSearchParams();

  // Support deep links like /?trial=CEFR+Ingliz+Tili — auto-opens the booking modal.
  useEffect(() => {
    const trial = searchParams.get('trial');
    if (trial && trial.trim()) {
      openTrial(trial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleScrollToCourses = () => {
    const el = document.getElementById('courses');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PublicLayout activePage="landing">
      <SEOHead
        title="Renessans O'quv Markazi — DTM, Milliy Sertifikat va CEFR tayyorlovi"
        description="Yangioboddagi nufuzli o'quv markazi. DTM & Milliy sertifikat, Aniq fanlar, CEFR ingliz tili, English Kids, mental arifmetika va ona tili kurslari. Bepul sinov darsi!"
        canonicalUrl={getSiteUrl()}
      />

      <HeroSection onOpenTrialModal={openTrial} onScrollToCourses={handleScrollToCourses} />
      <CoursesSection onSelectCourseForTrial={openTrial} />
      <TeachersSection />
      <ResultsSection />
      <FaqSection />
      <QuestionSection />
      <ContactSection onOpenTrialModal={() => openTrial()} />
    </PublicLayout>
  );
};