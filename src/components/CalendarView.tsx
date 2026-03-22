import { useMemo, useState, useEffect } from 'react';
import { ChessClass } from '@/lib/types';
import { getStudents } from '@/lib/store';
import { formatTimeDisplay, formatDateDisplay } from '@/lib/scheduler';
import { ChevronLeft, ChevronRight, CalendarDays, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarViewProps {
  classes: ChessClass[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = ({ classes }: CalendarViewProps) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const students = useMemo(() => getStudents(), []);
  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [students]);

  const { days, startOffset } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    return {
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      startOffset: firstDay,
    };
  }, [month, year]);

  const getClassDateTime = (cls: { scheduledDate: string; scheduledTime: string }) => {
    return new Date(`${cls.scheduledDate}T${cls.scheduledTime}:00`);
  };

  const isCompletedByTime = (cls: ChessClass) => {
    if (cls.status === 'cancelled') return false;
    const classDateTime = getClassDateTime(cls);
    return !Number.isNaN(classDateTime.getTime()) && classDateTime.getTime() < Date.now();
  };

  const getClassVisualStatus = (cls: ChessClass) => {
    if (cls.status === 'cancelled') return 'cancelled';
    if (isCompletedByTime(cls)) return 'completed';
    if (cls.isRescheduled) return 'rescheduled';
    return 'upcoming';
  };

  const statusStyles: Record<string, string> = {
    upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rescheduled: 'bg-orange-50 text-orange-700 border-orange-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200 opacity-80',
  };

  const statusDotStyles: Record<string, string> = {
    upcoming: 'bg-blue-500',
    completed: 'bg-emerald-500',
    rescheduled: 'bg-orange-500',
    cancelled: 'bg-red-500',
  };

  const classesByDate = useMemo(() => {
    const map: Record<string, ChessClass[]> = {};

    classes.forEach((cls) => {
      const d = cls.scheduledDate;
      if (!map[d]) map[d] = [];
      map[d].push(cls);
    });

    Object.keys(map).forEach((date) => {
      map[date].sort(
        (a, b) => getClassDateTime(a).getTime() - getClassDateTime(b).getTime()
      );
    });

    return map;
  }, [classes]);

  const selectedDayClasses = useMemo(() => {
    return classesByDate[selectedDate] || [];
  }, [classesByDate, selectedDate]);

  useEffect(() => {
    const selected = new Date(selectedDate);
    if (!Number.isNaN(selected.getTime())) {
      setMonth(selected.getMonth());
      setYear(selected.getFullYear());
    }
  }, [selectedDate]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    setSelectedDate(todayStr);
  };

  const selectedDateLabel = useMemo(() => {
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return selectedDate;
    return formatDateDisplay(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a day to view scheduled classes and their status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
          <span className={`h-2 w-2 rounded-full ${statusDotStyles.upcoming}`} />
          Upcoming
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
          <span className={`h-2 w-2 rounded-full ${statusDotStyles.completed}`} />
          Completed
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
          <span className={`h-2 w-2 rounded-full ${statusDotStyles.rescheduled}`} />
          Rescheduled
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
          <span className={`h-2 w-2 rounded-full ${statusDotStyles.cancelled}`} />
          Cancelled
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
        <div className="rounded-3xl border overflow-hidden bg-card">
          <div className="grid grid-cols-7 gap-px bg-border">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="bg-secondary p-3 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}

            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card min-h-[110px]" />
            ))}

            {days.map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayClasses = classesByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              const statusCounts = dayClasses.reduce<Record<string, number>>((acc, cls) => {
                const status = getClassVisualStatus(cls);
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {});

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`bg-card p-2 min-h-[110px] text-left transition-colors hover:bg-muted/30 ${
                    isSelected ? 'ring-2 ring-primary ring-inset' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {day}
                    </span>

                    {dayClasses.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {dayClasses.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayClasses.slice(0, 2).map((cls) => {
                      const visualStatus = getClassVisualStatus(cls);
                      return (
                        <div
                          key={cls.id}
                          className={`text-[10px] leading-tight px-2 py-1 rounded-lg border truncate ${statusStyles[visualStatus]}`}
                        >
                          {studentMap[cls.studentId]?.split(' ')[0] || 'Student'}{' '}
                          {formatTimeDisplay(cls.scheduledTime)}
                        </div>
                      );
                    })}

                    {dayClasses.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayClasses.length - 2} more
                      </div>
                    )}

                    {dayClasses.length > 0 && (
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        {Object.entries(statusCounts).map(([status, count]) => (
                          <span
                            key={status}
                            className={`h-2 w-2 rounded-full ${statusDotStyles[status]}`}
                            title={`${count} ${status}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Selected day</h3>
            </div>
            <p className="text-sm text-muted-foreground">{selectedDateLabel}</p>
          </div>

          {selectedDayClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
              <p className="font-medium mb-1">No classes on this day</p>
              <p className="text-sm text-muted-foreground">
                Pick another day to review the schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayClasses.map((cls) => {
                const visualStatus = getClassVisualStatus(cls);

                return (
                  <div
                    key={cls.id}
                    className="rounded-2xl border bg-background/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {studentMap[cls.studentId] || 'Unknown Student'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5" />
                          {formatTimeDisplay(cls.scheduledTime)} IST
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[visualStatus]}`}
                      >
                        {visualStatus === 'upcoming'
                          ? 'Upcoming'
                          : visualStatus === 'completed'
                          ? 'Completed'
                          : visualStatus === 'rescheduled'
                          ? 'Rescheduled'
                          : 'Cancelled'}
                      </span>
                    </div>

                    {cls.isRescheduled && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Original date: {formatDateDisplay(cls.originalDate)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
