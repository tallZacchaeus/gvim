/* Site-wide facts. SITE itself still lives in lib/api.ts (it is used by the admin
   too); this module re-exports it and adds the public-site-only additions rather
   than duplicating the values. */
import { SITE } from '../lib/api';

export { SITE };

export const address = {
  street: '4511 36 Ave NW',
  city: 'Edmonton',
  region: 'AB',
  postal: 'T6L 3R9',
  country: 'Canada'
};

export const addressOneLine = `${address.street}, ${address.city}, ${address.region} ${address.postal}`;

export const founded = 2018;
export const locationLabel = `${address.city}, Alberta · Est. ${founded}`;

export const giving = {
  /* PLACEHOLDER — replace with the real online giving URL when you have one.
     Until it is set, the UI renders the button as disabled with a note rather
     than linking somewhere wrong. */
  onlineUrl: '' as string,
  eTransferEmail: SITE.email,
  /** What giving actually pays for. Kept short and concrete. */
  supports: 'community outreach, school supplies for children, and missions'
};

export const socials = [
  { label: 'Facebook', href: SITE.facebook, icon: 'fab fa-facebook-f' },
  { label: 'YouTube',  href: SITE.youtube,  icon: 'fab fa-youtube' }
];

export const officeHours = [
  { when: 'Monday – Friday', time: '9:00 AM – 5:00 PM' },
  { when: 'Saturday',        time: '10:00 AM – 2:00 PM' },
  { when: 'Sunday',          time: 'During service hours' }
];

export const legalLine = 'Registered non-profit religious organization';
