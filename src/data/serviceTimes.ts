/* Single source of truth for the schedule.
   Consumed by the Home service-times block, the About page and the Footer.
   Changing a time here changes it in all three — do not hand-copy these values. */

export interface ServiceSlot {
  /** When it happens, e.g. "Sunday" or "Third Sunday". */
  when: string;
  /** What it is, e.g. "Bible Study". */
  what: string;
  /** Local start time, Mountain Time. */
  time: string;
}

export const weekly: ServiceSlot[] = [
  { when: 'Sunday',  what: 'First service',  time: '10:00 AM' },
  { when: 'Sunday',  what: 'Second service', time: '2:00 PM' },
  { when: 'Tuesday', what: 'Bible study',    time: '6:00 PM' }
];

export const monthly: ServiceSlot[] = [
  { when: '1st of the month', what: 'Healing Hour',                      time: '6:00 AM' },
  { when: 'Third Sunday',     what: '"Just as it was" — Family Service', time: '2:00 PM' },
  { when: 'Fourth Sunday',    what: 'Prayer Meeting',                    time: '2:00 PM' },
  { when: 'Fifth Sunday',     what: 'Youth Service',                     time: '2:00 PM' }
];

export const timezoneNote = 'All times Mountain Time.';

/** Condensed one-liner for the utility bar. Derived so it cannot drift from the table. */
export const summary =
  `Sundays ${weekly[0].time} & ${weekly[1].time} · Tuesdays ${weekly[2].time}`;
