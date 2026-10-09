export interface NavItem { to: string; label: string; end?: boolean }

/* Order is deliberate: Sermons before Gallery, because someone evaluating a
   church looks for teaching before photographs. */
export const navItems: NavItem[] = [
  { to: '/',        label: 'Home', end: true },
  { to: '/about',   label: 'About' },
  { to: '/sermons', label: 'Sermons' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' }
];
