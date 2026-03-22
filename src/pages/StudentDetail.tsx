import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudents, getClassesForStudent, updateClass, deleteStudent, cancelClassAndGenerateReplacement } from '@/lib/store';
import { formatTimeDisplay, formatDateDisplay } from '@/lib/scheduler';
import { COMMON_TIMEZONES, TEACHER_TIMEZONE, ChessClass } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, Clock, MapPin, User, Trash2, XCircle, RotateCcw } from 'lucide-react';

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rescheduleClass, setRescheduleClass] = useState<ChessClass | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const student = useMemo(() => getStudents().find(s => s.id === id), [id, refreshKey]);
  const classes = useMemo(() => id ? getClassesForStudent(id) : [], [id, refreshKey]);

  const completedClasses = classes.filter(c => c.status === 'completed');
  const cancelledClasses = classes.filter(c => c.status === 'cancelled');
  const upcomingClasses = classes.filter(c => c.status !== 'completed' && c.status !== 'cancelled');

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  const tzLabel = COMMON_TIMEZONES.find(t => t.value === student.timezone)?.label || student.timezone;
  const classesRemaining = student.totalClasses - completedClasses.length;

  const handleReschedule = () => {
    if (!rescheduleClass || !newDate || !newTime) return;
    
    const updated: ChessClass = {
      ...rescheduleClass,
      scheduledDate: newDate,
      scheduledTime: newTime,
      status: 'rescheduled',
      isRescheduled: true,
    };
    updateClass(updated);
    setRescheduleClass(null);
    setNewDate('');
    setNewTime('');
    setRefreshKey(k => k + 1);
  };

  const handleMarkCancelled = (cls: ChessClass) => {
    cancelClassAndGenerateReplacement(cls);
    setRefreshKey(k => k + 1);
  };

  const handleRestoreCompleted = (cls: ChessClass) => {
    const updated: ChessClass = { ...cls, status: 'completed' };
    updateClass(updated);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = () => {
    deleteStudent(student.id);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="animate-fade-in-up">
          {/* Student Info */}
          <div className="card-elevated p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">{student.name}</h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground mt-2">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> Age {student.age}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {student.country}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {tzLabel}</span>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {student.name}?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete this student and all their classes.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{student.totalClasses}</p>
                <p className="text-xs text-muted-foreground">Total Classes</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-success">{completedClasses.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{classesRemaining}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{cancelledClasses.length}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{student.classesPerWeek}x</p>
                <p className="text-xs text-muted-foreground">Per Week</p>
              </div>
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Classes ({upcomingClasses.length})</h2>
            {upcomingClasses.length === 0 ? (
              <div className="card-elevated p-8 text-center text-muted-foreground">
                All classes completed!
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingClasses.map((cls, i) => (
                  <div
                    key={cls.id}
                    className="card-elevated p-4 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{formatDateDisplay(cls.scheduledDate)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{formatTimeDisplay(cls.scheduledTime)}</span>
                        <span className="mx-1">IST</span>
                        <span className="text-xs">({formatTimeDisplay(cls.studentTime)} student time)</span>
                      </div>
                      {cls.isRescheduled && <span className="badge-rescheduled">Rescheduled</span>}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
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
                            Original: {formatDateDisplay(cls.originalDate)} at {formatTimeDisplay(cls.scheduledTime)} IST
                          </p>
                          <div className="space-y-2">
                            <Label>New Date</Label>
                            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>New Time (IST)</Label>
                            <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                          </div>
                          <Button onClick={handleReschedule} className="w-full">
                            Confirm Reschedule
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Classes */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Completed Classes ({completedClasses.length})</h2>
            {completedClasses.length === 0 ? (
              <div className="card-elevated p-8 text-center text-muted-foreground">
                No classes completed yet.
              </div>
            ) : (
              <div className="space-y-2">
                {completedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="card-elevated p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatDateDisplay(cls.scheduledDate)}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatTimeDisplay(cls.scheduledTime)} IST
                      </span>
                      <span className="badge-completed">Done</span>
                      {cls.isRescheduled && <span className="badge-rescheduled text-xs">Was rescheduled</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleMarkCancelled(cls)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Not Conducted
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancelled Classes */}
          {cancelledClasses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cancelled Classes ({cancelledClasses.length})</h2>
              <div className="space-y-2">
                {cancelledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="card-elevated p-4 flex items-center justify-between opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium line-through">{formatDateDisplay(cls.scheduledDate)}</span>
                      <span className="text-sm font-mono text-muted-foreground line-through">
                        {formatTimeDisplay(cls.scheduledTime)} IST
                      </span>
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Cancelled</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreCompleted(cls)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
