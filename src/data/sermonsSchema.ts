/* Shape of a record in sermons.json. Kept beside the file so the JSON and the
   UI cannot drift apart: adding a field here is a compile error until every
   consumer handles it. */
export interface SermonRecord {
  id: string;
  title: string;
  speaker: string;
  /** ISO date, e.g. "2026-03-15". */
  date: string;
  /** Scripture reference, e.g. "Romans 8:28". */
  scripture?: string;
  /** Series name — drives the filter bar. Omit for standalone messages. */
  series?: string;
  /** 11-character YouTube ID, not the full URL. */
  youtubeId?: string;
  description?: string;
}

import raw from './sermons.json';

export const seedSermons: SermonRecord[] = (raw as { sermons: SermonRecord[] }).sermons ?? [];
