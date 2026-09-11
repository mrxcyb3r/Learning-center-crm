import { crmService } from './crmService';

/**
 * @deprecated Offline fallback only. The production path for public content is
 * Firestore via `src/services/repository.ts` (`coursesService`,
 * `teachersService`, `resultsService`, `landingCmsService`, `leadsService`,
 * `questionsService`). This bridge reads legacy localStorage-backed
 * `crmService` data so public pages never render blank when Firestore is
 * unreachable or unseeded.
 */
export const cmsBridge = {
  getHero() {
    const cms = crmService.getCmsData();
    return {
      centerName: cms.hero.centerName,
      tagline: cms.hero.tagline,
      subtitle: cms.hero.subtitle,
      badge: cms.hero.badge,
    };
  },

  getStats() {
    const cms = crmService.getCmsData();
    return cms.stats;
  },

  getCourses() {
    return crmService.getCourses().filter((c) => c.isActive && c.isPublic !== false);
  },

  getTeachers() {
    return crmService.getTeachers().filter((t) => t.isPublic !== false && t.status === 'Active');
  },

  getResults() {
    const cms = crmService.getCmsData();
    return cms.results || [];
  },

  getFaqs() {
    const cms = crmService.getCmsData();
    return cms.faqs || [];
  },

  getContact() {
    const cms = crmService.getCmsData();
    return cms.contact;
  },
};
