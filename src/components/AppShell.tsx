import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle2,
  UserPlus,
  CalendarDays,
  LogOut,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Add Student',
    to: '/add-student',
    icon: UserPlus,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: UserCircle2,
  },
];

const AppShell = ({ children }: AppShellProps) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const coachName = profile?.coach_name?.trim() || 'Coach';
  const subjects =
    profile && Array.isArray(profile.subjects) && profile.subjects.length > 0
      ? profile.subjects.join(', ')
      : 'Classes';

  const coachInitials =
    profile?.coach_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'C';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-72 border-r bg-card/80 backdrop-blur flex-col">
          <div className="px-6 py-6 border-b">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-left"
            >
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Class Planner</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {subjects}
                </p>
              </div>
            </button>
          </div>

          <div className="px-6 py-5 border-b">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 rounded-2xl border bg-background/60 px-3 py-3 text-left hover:border-primary/30 transition-colors"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {coachInitials}
              </span>
              <div className="min-w-0">
                <p className="font-medium truncate">{coachName}</p>
                <p className="text-xs text-muted-foreground truncate">Coach profile</p>
              </div>
            </button>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-1" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
