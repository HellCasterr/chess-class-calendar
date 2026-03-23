import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatTimeDisplay, formatDateDisplay } from '@/lib/scheduler';
import { COMMON_TIMEZONES, ChessClass, Student } from '@/lib/types';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  MapPin,
  User,
  Trash2,
  XCircle,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import {
  fetchStudentById,
  fetchClassesForStudent,
  updateClassRecord,
  deleteStudentRecord,
  createSingleClass,
} from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ChessClass[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [rescheduleClass, setRescheduleClass] = useState<ChessClass | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const loadData = async () => {
    if (!user || !id) return;

    setLoadingData(true);

    try {
      const studentData = await fetchStudentById(user.id, id);
      setStudent(studentData);

      if (!studentData) {
        setClasses([]);
        return;
      }

      try {
        const classesData = await fetchClassesForStudent(user.id, id);
        setClasses(classesData);
      } catch (classError) {
        console.error('Failed to load classes:', classError);
        setClasses([]);
        toast.error('Student loaded, but classes could not be loaded.');
      }
    } catch (error) {
      console.error('Failed to load student:', error);
      toast.error('Failed to load student details.');
      setStudent(null);
      setClasses([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, id]);

  const getClassDateTime = (cls: ChessClass) => {
    return new Date(`${cls.scheduledDate}T${cls.scheduledTime}:00`);
  };

  const isClassCompletedByTime = (cls: ChessClass) => {
    if (cls.status === 'cancelled') return false;
    const classDateTime = getClassDateTime(cls);
    return !Number.isNaN(classDateTime.getTime()) && classDateTime.getTime() < Date.now();
  };

  const cancelledClasses = useMemo(
    () => classes.filter((c) => c.status === 'cancelled'),
    [classes]
  );

  const completedClasses = useMemo(
    () =>
      classes
        .filter((c) => {
          if (c.status === 'cancelled') return false;
          return isClassCompletedByTime(c);
        })
        .sort((a, b) => getClassDateTime(b).getTime() - getClassDateTime(a).getTime()),
    [classes]
  );

  const upcomingClasses = useMemo(
    () =>
      classes
        .filter((c) => {
          if (c.status === 'cancelled') return false;
          return !isClassCompletedByTime(c);
        })
        .sort((a, b) => getClassDateTime(a).getTime() - getClassDateTime(b).getTime()),
    [classes]
  );

  if (loadingData) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold">Student Details</h1>
              <p className="text-sm text-muted-foreground">Loading student data...</p>
            </div>
          </header>

          <div className="max-w-5xl mx-auto px-4 py-16">
            <p className="text-muted-foreground">Loading student details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!student) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold">Student Details</h1>
              <p className="text-sm text-muted-foreground">
                Manage class schedules and progress
              </p>
            </div>
          </header>

          <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
            <p className="text-muted-foreground">Student not found.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const tzLabel =
    COMMON_TIMEZONES.find((t) => t.value === student.timezone)?.label || student.timezone;
  const classesRemaining = Math.max(student.totalClasses - completedClasses.length, 0);
  const completionPercent =
    student.totalClasses > 0
      ? Math.round((completedClasses.length / student.totalClasses) * 100)
      : 0;
  const nextClass = upcomingClasses[0] || null;

  const handleReschedule = async () => {
    if (!user || !rescheduleClass || !newDate || !newTime) return;

    try {
      const updatedDateTime = new Date(`${newDate}T${newTime}:00`);
      const isPast =
        !Number.isNaN(updatedDateTime.getTime()) && updatedDateTime.getTime() < Date.now();

      const updated: ChessClass = {
        ...rescheduleClass,
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: isPast ? 'completed' : 'rescheduled',
        isRescheduled: true,
      };

      await updateClassRecord(user.id, updated);
      setRescheduleClass(null);
      setNewDate('');
      setNewTime('');
      toast.success('Class rescheduled.');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reschedule class.');
    }
  };

  const handleMarkCancelled = async (cls: ChessClass) => {
    if (!user) return;

    try {
      const cancelledClass: ChessClass = {
        ...cls,
        status: 'cancelled',
      };

      await updateClassRecord(user.id, cancelledClass);

      const replacementClass: ChessClass = {
        id: crypto.randomUUID(),
        studentId: cls.studentId,
        originalDate: cls.originalDate,
        scheduledDate: cls.scheduledDate,
        scheduledTime: cls.scheduledTime,
        studentTime: cls.studentTime,
        status: 'upcoming',
        isRescheduled: false,
      };

      await createSingleClass(user.id, replacementClass);

      toast.success('Class marked as not conducted and replacement generated.');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to cancel class.');
    }
  };

  const handleRestoreCompleted = async (cls: ChessClass) => {
    if (!user) return;

    try {
      const restoredDateTime = getClassDateTime(cls);
      const isPast =
        !Number.isNaN(restoredDateTime.getTime()) && restoredDateTime.getTime() < Date.now();

      const updated: ChessClass = {
        ...cls,
        status: isPast ? 'completed' : cls.isRescheduled ? 'rescheduled' : 'upcoming',
      };

      await updateClassRecord(user.id, updated);
      toast.success('Class restored.');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to restore class.');
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      await deleteStudentRecord(user.id, student.id);
      toast.success('Student deleted.');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete student.');
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">Student Details</h1>
            <p className="text-sm text-muted-foreground">
              Track progress, manage class schedules, and handle changes
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold leading-tight">{student.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Student profile and schedule overview
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-muted-foreground mt-4">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Age {student.age}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {student.country}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {tzLabel}
                  </span>
                  {student.subject && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      {student.subject}
                    </span>
                  )}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {student.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this student and all their classes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-sm font-medium">Course progress</p>
                <p className="text-sm text-muted-foreground">{completionPercent}% complete</p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{student.totalClasses}</p>
                <p className="text-xs text-muted-foreground">Total Classes</p>
              </div>
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{completedClasses.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">{classesRemaining}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{cancelledClasses.length}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{student.classesPerWeek}x</p>
                <p className="text-xs text-muted-foreground">Per Week</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Next class</h3>
              <p className="text-sm text-muted-foreground">
                The next upcoming session for this student.
              </p>
            </div>

            {nextClass ? (
              <div className="rounded-2xl border bg-background/60 p-4">
                <p className="font-semibold">{formatDateDisplay(nextClass.scheduledDate)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTimeDisplay(nextClass.scheduledTime)} IST
                  <span className="mx-1">·</span>
                  Student time: {formatTimeDisplay(nextClass.studentTime)}
                </p>
                {nextClass.isRescheduled && (
                  <span className="inline-flex mt-3 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium">
                    Rescheduled
                  </span>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-muted-foreground">
                No upcoming classes for this student.
              </div>
            )}
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Upcoming Classes ({upcomingClasses.length})</h3>
              <p className="text-sm text-muted-foreground">
                Reschedule future sessions or review what’s coming next.
              </p>
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
                All classes completed.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((cls, i) => (
                  <div
                    key={cls.id}
                    className="rounded-2xl border bg-background/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{formatDateDisplay(cls.scheduledDate)}</span>
                        {cls.isRescheduled && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary font-medium">
                            Rescheduled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatTimeDisplay(cls.scheduledTime)} IST
                        <span className="mx-1">·</span>
                        Student time: {formatTimeDisplay(cls.studentTime)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Original slot: {formatDateDisplay(cls.originalDate)}
                      </p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            setRescheduleClass(cls);
                            setNewDate(cls.scheduledDate);
                            setNewTime(cls.scheduledTime);
                          }}
                        >
                          Reschedule
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reschedule Class</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">
                            Original: {formatDateDisplay(cls.originalDate)} at{' '}
                            {formatTimeDisplay(cls.scheduledTime)} IST
                          </p>
                          <div className="space-y-2">
                            <Label>New Date</Label>
                            <Input
                              type="date"
                              value={newDate}
                              onChange={(e) => setNewDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>New Time (IST)</Label>
                            <Input
                              type="time"
                              value={newTime}
                              onChange={(e) => setNewTime(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleReschedule} className="w-full rounded-xl">
                            Confirm Reschedule
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Completed Classes ({completedClasses.length})</h3>
              <p className="text-sm text-muted-foreground">
                Past sessions automatically appear here based on class time.
              </p>
            </div>

            {completedClasses.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
                No classes completed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {completedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-2xl border bg-background/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{formatDateDisplay(cls.scheduledDate)}</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700 font-medium">
                          Done
                        </span>
                        {cls.isRescheduled && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary font-medium">
                            Was rescheduled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatTimeDisplay(cls.scheduledTime)} IST
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                      onClick={() => handleMarkCancelled(cls)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Not Conducted
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {cancelledClasses.length > 0 && (
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Cancelled Classes ({cancelledClasses.length})</h3>
                <p className="text-sm text-muted-foreground">
                  Restore a cancelled class if it should count again.
                </p>
              </div>

              <div className="space-y-3">
                {cancelledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-2xl border bg-background/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-75"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium line-through">
                          {formatDateDisplay(cls.scheduledDate)}
                        </span>
                        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive font-medium">
                          Cancelled
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-through">
                        {formatTimeDisplay(cls.scheduledTime)} IST
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => handleRestoreCompleted(cls)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </AppShell>
  );
};

export default StudentDetail;
