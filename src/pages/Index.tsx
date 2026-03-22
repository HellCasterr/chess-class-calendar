import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getStudents, getClasses } from '@/lib/store';
import { formatTimeDisplay, formatDateDisplay } from '@/lib/scheduler';
import { COMMON_TIMEZONES } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import CalendarView from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, Clock, BookOpen, LogOut } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const students = useMemo(() => getStudents(), []);
  const allClasses = useMemo(() => getClasses(), []);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = allClasses.filter(c => c.scheduledDate === todayStr && c.status !== 'completed' && c.status !== 'cancelled');
  const upcomingClasses = allClasses
    .filter(c => c.status !== 'completed' && c.status !== 'cancelled')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);

  const completedCount = allClasses.filter(c => c.status === 'completed').length;
  const cancelledCount = allClasses.filter(c => c.status === 'cancelled').length;
  const upcomingCount = allClasses.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length;

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [students]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Chess Class Scheduler</h1>
          </div>
          <Button onClick={() => navigate('/add-student')} className="active:scale-[0.97] transition-transform">
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Students</span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{students.length}</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Today</span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{todayClasses.length}</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Upcoming</span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{upcomingCount}</p>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Done</span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{completedCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-semibold mb-4">Calendar</h2>
            <CalendarView classes={allClasses} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {/* Today's Classes */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Today's Classes</h2>
              {todayClasses.length === 0 ? (
                <div className="card-elevated p-6 text-center text-muted-foreground text-sm">
                  No classes today
                </div>
              ) : (
                <div className="space-y-2">
                  {todayClasses.map(cls => (
                    <div key={cls.id} className="card-elevated p-3">
                      <p className="font-medium">{studentMap[cls.studentId]}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatTimeDisplay(cls.scheduledTime)} IST
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students List */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Students</h2>
              {students.length === 0 ? (
                <div className="card-elevated p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-3">No students yet</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/add-student')}>
                    <Plus className="w-4 h-4 mr-1" /> Add First Student
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map(student => {
                    const studentClasses = allClasses.filter(c => c.studentId === student.id);
                    const done = studentClasses.filter(c => c.status === 'completed').length;
                    const tzLabel = COMMON_TIMEZONES.find(t => t.value === student.timezone)?.label?.split('(')[0]?.trim() || student.country;
                    
                    return (
                      <Link
                        key={student.id}
                        to={`/student/${student.id}`}
                        className="card-elevated p-4 block hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.country} · Age {student.age}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono tabular-nums">{done}/{student.totalClasses}</p>
                            <p className="text-xs text-muted-foreground">classes</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
