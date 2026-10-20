import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CloudUpload, Images, Mail, MoreHorizontal } from 'lucide-react';

/* Five destinations is the practical ceiling for a tab bar — past that the
   targets get too narrow for a thumb. The rest live behind "More", which opens
   the existing Sheet so focus trapping and Escape come for free. */
const TABS = [
  { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Home' },
  { to: '/admin/gallery-upload', icon: CloudUpload,     label: 'Upload' },
  { to: '/admin/gallery-manage', icon: Images,          label: 'Gallery' },
  { to: '/admin/contacts',       icon: Mail,            label: 'Messages' }
];

export default function BottomTabs({ onMore }: { onMore: () => void }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      <ul>
        {TABS.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => 'tabbar__tab' + (isActive ? ' is-on' : '')}>
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
        <li>
          <button type="button" className="tabbar__tab" onClick={onMore}>
            <MoreHorizontal size={22} aria-hidden="true" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
