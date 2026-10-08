import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CloudUpload, Images, Mic, ListMusic, Tags, Mail,
  ExternalLink, LogOut, Menu, Search
} from 'lucide-react';
import { api } from '../lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Toaster } from '@/components/ui/sonner';

const NAV = [
  { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/gallery-upload', icon: CloudUpload,     label: 'Upload Gallery' },
  { to: '/admin/gallery-manage', icon: Images,          label: 'Manage Gallery' },
  { to: '/admin/sermon-add',     icon: Mic,             label: 'Add Sermon' },
  { to: '/admin/sermon-manage',  icon: ListMusic,       label: 'Manage Sermons' },
  { to: '/admin/categories',     icon: Tags,            label: 'Categories' },
  { to: '/admin/contacts',       icon: Mail,            label: 'Contacts' }
];

/** Nav list, shared by the desktop sidebar and the mobile Sheet. */
function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}>
          <Icon size={17} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <hr className="admin-nav-sep" />
      <Link to="/" target="_blank" rel="noopener noreferrer">
        <ExternalLink size={17} aria-hidden="true" />
        View Site
      </Link>
      <button onClick={onLogout} className="admin-logout" type="button">
        <LogOut size={17} aria-hidden="true" />
        Log out
      </button>
    </nav>
  );
}

export default function AdminLayout({
  children, title, actions
}: { children: ReactNode; title: string; actions?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close the drawer on navigation, or it stays open over the new page.
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Cmd/Ctrl-K opens the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function logout() {
    await api.auth.logout().catch(() => {});
    navigate('/admin');
  }

  const current = NAV.find(n => n.to === location.pathname);

  /* No AdminFeedbackProvider here. It lives in ProtectedRoute, above the page
     components — pages call useFeedback() and then return <AdminLayout>, so a
     provider at this level would sit below its own consumers. */
  return (
      <div className="admin-wrap">
        {/* Desktop sidebar. Sheet handles <900px, so this is hidden there. */}
        <aside className="admin-sidebar" id="admin-sidebar">
          <div className="admin-brand">
            <img src="/gvim-logo.jpg" alt="" width={44} height={44} />
            <div><strong>GVIM</strong><span>Admin</span></div>
          </div>
          <Nav onLogout={logout} />
        </aside>

        {/* Sheet replaces the hand-rolled drawer: it brings focus trapping,
            Escape, scroll lock, aria-modal and focus restoration with it, all of
            which the previous implementation maintained by hand. */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="admin-sheet w-[17rem] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin navigation</SheetTitle>
            </SheetHeader>
            <div className="admin-sidebar admin-sidebar--sheet">
              <div className="admin-brand">
                <img src="/gvim-logo.jpg" alt="" width={44} height={44} />
                <div><strong>GVIM</strong><span>Admin</span></div>
              </div>
              <Nav onLogout={logout} />
            </div>
          </SheetContent>
        </Sheet>

        <main className="admin-main">
          <header className="admin-header">
            <button
              className="admin-menu-btn"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              type="button"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            <div className="admin-heading">
              <nav aria-label="Breadcrumb" className="admin-crumbs">
                <Link to="/admin/dashboard">Admin</Link>
                {current && current.to !== '/admin/dashboard' && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span aria-current="page">{current.label}</span>
                  </>
                )}
              </nav>
              <h1>{title}</h1>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-palette-btn"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search admin (Command K)"
              >
                <Search size={15} aria-hidden="true" />
                <span>Search</span>
                <kbd>⌘K</kbd>
              </button>
              {actions}
            </div>
          </header>
          <div className="admin-content">{children}</div>
        </main>

        <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen} title="Admin search"
          description="Jump to a section">
          <CommandInput placeholder="Jump to…" />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Sections">
              {NAV.map(({ to, icon: Icon, label }) => (
                <CommandItem key={to} value={label} onSelect={() => { setPaletteOpen(false); navigate(to); }}>
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem value="View public site" onSelect={() => window.open('/', '_blank')}>
                <ExternalLink size={16} aria-hidden="true" /> View public site
              </CommandItem>
              <CommandItem value="Log out" onSelect={logout}>
                <LogOut size={16} aria-hidden="true" /> Log out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        <Toaster position="bottom-center" richColors closeButton />
      </div>
  );
}
