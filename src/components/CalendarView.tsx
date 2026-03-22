import { useMemo, useState } from 'react';
import { ChessClass } from '@/lib/types';
import { getStudents } from '@/lib/store';
import { formatTimeDisplay } from '@/lib/scheduler';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarViewProps {
  classes: ChessClass[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = ({ classes }: CalendarViewProps) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const students = useMemo(() => getStudents(), []);
  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach(s => { map[s.id] = s.name; });
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

  const classesByDate = useMemo(() => {
    const map: Record<string, ChessClass[]> = {};
    classes.forEach(cls => {
      const d = cls.scheduledDate;
      if (!map[d]) map[d] = [];
      map[d].push(cls);
    });
    return map;
  }, [classes]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStr = today.toISOString().split('T')[0];

  const COLORS = [
    'bg-primary/15 text-primary',
    'bg-accent/15 text-accent',
    'bg-success/15 text-success',
    'bg-destructive/15 text-destructive',
    'bg-warning/15 text-warning',
  ];

  const studentColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    students.forEach((s, i) => {
      map[s.id] = COLORS[i % COLORS.length];
    });
    return map;
  }, [students]);

  return (
    <div className="card-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {DAY_LABELS.map(d => (
          <div key={d} className="bg-secondary p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card p-2 min-h-[80px]" />
        ))}

        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayClasses = classesByDate[dateStr] || [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={day}
              className={`bg-card p-1.5 min-h-[80px] transition-colors ${
                isToday ? 'ring-2 ring-primary ring-inset' : ''
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : 'text-muted-foreground'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayClasses.slice(0, 3).map(cls => (
                  <div
                    key={cls.id}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                      cls.status === 'completed' ? 'opacity-50' : ''
                    } ${studentColorMap[cls.studentId] || COLORS[0]}`}
                  >
                    {studentMap[cls.studentId]?.split(' ')[0]} {formatTimeDisplay(cls.scheduledTime)}
                  </div>
                ))}
                {dayClasses.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayClasses.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
