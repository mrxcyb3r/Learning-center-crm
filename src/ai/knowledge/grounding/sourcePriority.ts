/**
 * Canonical source priority constants.
 *
 * Priority values are intentionally isolated so they can be adjusted
 * centrally when the business authority rules change.  Higher numbers
 * win when multiple sources disagree about the same field.
 */

export const SOURCE_PRIORITY = {
  firestore_cms: 100,      // live course/teacher/result docs
  firestore_settings: 90,  // settings/center, settings/landing_cms
  markdown: 70,            // curated markdown knowledge
  landing_cms: 60,         // landing CMS raw document (public)
  default: 0,              // hard-coded / unknown
} as const;

export type SourcePriorityKey = keyof typeof SOURCE_PRIORITY;

/** Priority for a structured course/teacher result document. */
export const CMS_PRIORITY = SOURCE_PRIORITY.firestore_cms;

/** Priority for settings values (center, landing_cms). */
export const SETTINGS_PRIORITY = SOURCE_PRIORITY.firestore_settings;

/** Priority for curated markdown knowledge. */
export const MARKDOWN_PRIORITY = SOURCE_PRIORITY.markdown;