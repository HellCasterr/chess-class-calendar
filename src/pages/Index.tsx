import { useMemo, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatTimeDisplay, formatDateDisplay } from '@/lib/scheduler';
import { useAuth } from '@/contexts/AuthContext';
import { fetchStudents, fetchClasses } from '@/lib/db';
import { Student, ChessClass } from '@/lib/types';
import CalendarView from '@/components/CalendarView';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [allClasses, setAllClasses] = useState<ChessClass[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const coachTimezone = profile?.timezone || 'Asia/Kolkata';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoadingData(true);

      try {
        const [studentsData, classesData] = await Promise.all([
          fetchStudents(user.id),
          fetchClasses(user.id),
        ]);

        setStudents(studentsData);
        setAllClasses(classesData);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

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

  const getClassDateTime = (cls: { scheduledDate: string; scheduledTime: string }) => {
    return new Date(`${cls.scheduledDate}T${cls.scheduledTime}:00`);
  };

  const isCompletedByTime = (cls: {
    scheduledDate: string;
    scheduledTime: string;
    status: string;
  }) => {
    if (cls.status === 'cancelled') return false;
    const classDateTime = getClassDateTime(cls);
    return !Number.isNaN(classDateTime.getTime()) && classDateTime.getTime() < Date.now();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const todayClasses = allClasses
    .filter((c) => c.scheduledDate === todayStr && !isCompletedByTime(c) && c.status !== 'cancelled')
    .sort((a, b) => getClassDateTime(a).getTime() - getClassDateTime(b).getTime());

  const upcomingClasses = allClasses
    .filter((c) => !isCompletedByTime(c) && c.status !== 'cancelled')
    .sort((a, b) => getClassDateTime(a).getTime() - getClassDateTime(b).getTime())
    .slice(0, 6);

  const completedCount = allClasses.filter((c) => isCompletedByTime(c)).length;
  const upcomingCount = allClasses.filter(
    (c) => !isCompletedByTime(c) && c.status !== 'cancelled'
  ).length;

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [students]);

  const greetingName = profile?.coach_name?.trim() || 'Coach';

  const topStudents = students
    .map((student) => {
      const studentClasses = allClasses.filter((c) => c.studentId === student.id);
      const done = studentClasses.filter((c) => isCompletedByTime(c)).length;
      return {
        ...student,
        done,
      };
    })
    .sort((a, b) => b.done - a.done);

  const nextClass = upcomingClasses[0] || null;

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Coach Name:</span> {greetingName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {formattedCoachDate} · {formattedCoachTime} · {coachTimezone}
              </p>
            </div>

            <Button
              onClick={() => navigate('/add-student')}
              className="rounded-xl shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {loadingData ? (
            <section className="rounded-3xl border bg-card p-8 shadow-sm">
              <p className="text-muted-foreground">Loading dashboard...</p>
            </section>
          ) : students.length === 0 ? (
            <section className="rounded-3xl border bg-card p-8 md:p-12 shadow-sm">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
                  <Sparkles className="w-4 h-4" />
                  Welcome to Class Planner
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  Start by adding your first student
                </h2>
                <p className="text-muted-foreground text-base md:text-lg mb-6">
                  Set up student schedules, track completed classes, reschedule sessions, and manage your
                  week from one dashboard.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate('/add-student')} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add first student
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 mb-8">
                <div className="rounded-3xl border bg-card p-6 md:p-7 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Good to see you, {greetingName}</p>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Today’s classes</h2>
                    </div>
                    <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm text-primary font-medium">
                      {todayClasses.length} today
                    </div>
                  </div>

                  {todayClasses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
                      <p className="font-medium mb-1">No classes scheduled for today</p>
                      <p className="text-sm text-muted-foreground">
                        Use the calendar below to review upcoming sessions.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayClasses.slice(0, 4).map((cls) => (
                        <div
                          key={cls.id}
                          className="rounded-2xl border bg-background/60 px-4 py-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {studentMap[cls.studentId] || 'Unknown Student'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateDisplay(cls.scheduledDate)} · {formatTimeDisplay(cls.scheduledTime)} IST
                            </p>
                          </div>
                          <Link
                            to={`/student/${cls.studentId}`}
                            className="text-sm font-medium text-primary hover:underline shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Students</span>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{students.length}</p>
                  </div>

                  <div className="rounded-3xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Today</span>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{todayClasses.length}</p>
                  </div>

                  <div className="rounded-3xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-primary mb-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Upcoming</span>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{upcomingCount}</p>
                  </div>

                  <div className="rounded-3xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-600 mb-3">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Completed</span>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{completedCount}</p>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
                <div className="space-y-6">
                  <div className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Calendar</h3>
                        <p className="text-sm text-muted-foreground">
                          Review the month and spot upcoming teaching load at a glance.
                        </p>
                      </div>
                    </div>
                    <CalendarView classes={allClasses} />
                  </div>

                  <div className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Next up</h3>
                        <p className="text-sm text-muted-foreground">
                          Your next few scheduled sessions.
                        </p>
                      </div>
                    </div>

                    {upcomingClasses.length === 0 ? (
                      <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
                        <p className="font-medium mb-1">No upcoming classes</p>
                        <p className="text-sm text-muted-foreground">
                          Add a student or reschedule a session to populate this section.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingClasses.map((cls, index) => (
                          <div
                            key={cls.id}
                            className="rounded-2xl border bg-background/60 px-4 py-4 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold truncate">
                                  {studentMap[cls.studentId] || 'Unknown Student'}
                                </p>
                                {index === 0 && (
                                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary font-medium">
                                    Next class
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDateDisplay(cls.scheduledDate)} · {formatTimeDisplay(cls.scheduledTime)} IST
                              </p>
                            </div>
                            <Link
                              to={`/student/${cls.studentId}`}
                              className="text-sm font-medium text-primary hover:underline shrink-0"
                            >
                              Open
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Student roster</h3>
                      <p className="text-sm text-muted-foreground">
                        Track progress and jump into each student’s schedule.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {topStudents.map((student) => (
                        <Link
                          key={student.id}
                          to={`/student/${student.id}`}
                          className="block rounded-2xl border bg-background/60 px-4 py-4 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{student.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {student.subject ? `${student.subject} · ` : ''}
                                {student.country} · Age {student.age}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold tabular-nums">
                                {student.done}/{student.totalClasses}
                              </p>
                              <p className="text-xs text-muted-foreground">completed</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Quick insight</h3>
                      <p className="text-sm text-muted-foreground">
                        A simple snapshot of what needs your attention.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl bg-primary/5 p-4">
                        <p className="text-sm text-muted-foreground mb-1">Next class</p>
                        {nextClass ? (
                          <>
                            <p className="font-semibold">
                              {studentMap[nextClass.studentId] || 'Unknown Student'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateDisplay(nextClass.scheduledDate)} ·{' '}
                              {formatTimeDisplay(nextClass.scheduledTime)} IST
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold">No upcoming classes</p>
                        )}
                      </div>

                      <button
                        onClick={() => navigate('/add-student')}
                        className="w-full rounded-2xl border border-dashed p-4 text-left hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">Add another student</p>
                            <p className="text-sm text-muted-foreground">
                              Set up a new timetable and start tracking sessions.
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
};

export default Index;
