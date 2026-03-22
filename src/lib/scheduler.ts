import { Student, ChessClass, DayOfWeek, TEACHER_TIMEZONE } from './types';

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

export function generateClasses(student: Student): ChessClass[] {
  const classes: ChessClass[] = [];
  const startDate = new Date(student.startDate);
  
  // Generate classes for the total number specified
  let classCount = 0;
  const maxWeeks = Math.ceil(student.totalClasses / student.classesPerWeek) + 2;
  
  for (let week = 0; week < maxWeeks && classCount < student.totalClasses; week++) {
    for (const slot of student.schedule) {
      if (classCount >= student.totalClasses) break;
      
      const targetDay = DAY_MAP[slot.day];
      const classDate = getNextDayOfWeek(startDate, targetDay, week);
      
      // Convert time from input timezone to both teacher and student timezones
      const { teacherTime, studentTime, adjustedDate } = convertTime(
        slot.time,
        slot.inputTimezone,
        student.timezone,
        classDate
      );
      
      const now = new Date();
      const classDateTime = new Date(adjustedDate + 'T' + teacherTime + ':00');
      // Set timezone offset for IST
      const istOffset = 5.5 * 60;
      const utcTime = classDateTime.getTime() + (classDateTime.getTimezoneOffset() - istOffset) * 60000;
      const isCompleted = utcTime < now.getTime();
      
      classes.push({
        id: `${student.id}-${classCount}`,
        studentId: student.id,
        originalDate: adjustedDate,
        scheduledDate: adjustedDate,
        scheduledTime: teacherTime,
        studentTime: studentTime,
        status: isCompleted ? 'completed' : 'upcoming',
        isRescheduled: false,
      });
      
      classCount++;
    }
  }
  
  return classes.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

function getNextDayOfWeek(startDate: Date, targetDay: number, weekOffset: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (weekOffset * 7));
  
  const currentDay = date.getDay();
  let diff = targetDay - currentDay;
  if (diff < 0 && weekOffset === 0) diff += 7;
  if (weekOffset > 0 && diff < 0) diff += 7;
  
  date.setDate(date.getDate() + diff);
  return date;
}

function convertTime(
  time: string,
  inputTimezone: string,
  studentTimezone: string,
  date: Date
): { teacherTime: string; studentTime: string; adjustedDate: string } {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date in the input timezone
  const dateStr = date.toISOString().split('T')[0];
  const inputDateStr = `${dateStr}T${time}:00`;
  
  // Get UTC offset for input timezone
  const inputDate = new Date(inputDateStr);
  const inputOffset = getTimezoneOffset(inputTimezone, inputDate);
  
  // Get UTC time
  const utcMs = inputDate.getTime() - inputOffset * 60000;
  
  // Convert to teacher timezone (IST)
  const teacherOffset = getTimezoneOffset(TEACHER_TIMEZONE, new Date(utcMs));
  const teacherDate = new Date(utcMs + teacherOffset * 60000);
  
  // Convert to student timezone
  const studentOffset = getTimezoneOffset(studentTimezone, new Date(utcMs));
  const studentDate = new Date(utcMs + studentOffset * 60000);
  
  return {
    teacherTime: formatTime(teacherDate),
    studentTime: formatTime(studentDate),
    adjustedDate: teacherDate.toISOString().split('T')[0],
  };
}

function getTimezoneOffset(timezone: string, date: Date): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone: timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatTimeDisplay(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
