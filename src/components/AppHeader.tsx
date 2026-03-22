import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showAddStudent?: boolean;
  showProfile?: boolean;
  backLabel?: string;
  backTo?: string;
}

const AppHeader = ({
  title = 'Class Planner',
  subtitle,
  showAddStudent = true,
  showProfile = true,
  backLabel,
  backTo,
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const coachTimezone = profile?.timezone || 'Asia/Kolkata';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const formattedCoachDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: coachTimezone,
    }).format(now);
  }, [now, coachTimezone]);

  const formattedCoachTime = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: coachTimezone,
      timeZoneName: 'short',
    }).format(now);
  }, [now, coachTimezone]);

  const coachName = profile?.coach_name?.trim() || 'Coach';

  const coachInitials =
    profile?.coach_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'C';

  const subjectLine =
    profile && Array.isArray(profile.subjects) && profile.subjects.length > 0
      ? profile.subjects.join(', ')
      : subtitle || 'Classes';

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate">{subjectLine}</p>
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-medium text-foreground">Coach Name:</span> {coachName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {formattedCoachDate} · {formattedCoachTime} · {coachTimezone}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {backLabel && backTo && (
            <Button
              variant="outline"
              onClick={() => navigate(backTo)}
              className="rounded-xl hidden sm:inline-flex"
            >
              {backLabel}
            </Button>
          )}

          {showProfile && (
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="rounded-xl gap-2 px-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {coachInitials}
              </span>
              <span className="hidden sm:inline">Profile</span>
            </Button>
          )}

          {showAddStudent && (
            <Button
              onClick={() => navigate('/add-student')}
              className="active:scale-[0.98] transition-transform rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sign out"
            className="rounded-xl"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
