import { Student, ChessClass, TEACHER_TIMEZONE } from './types';

const STUDENTS_KEY = 'chess-scheduler-students';
const CLASSES_KEY = 'chess-scheduler-classes';

export function getStudents(): Student[] {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveStudents(students: Student[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function addStudent(student: Student) {
  const students = getStudents();
  students.push(student);
  saveStudents(students);
}

export function deleteStudent(id: string) {
  const students = getStudents().filter(s => s.id !== id);
  saveStudents(students);
  const classes = getClasses().filter(c => c.studentId !== id);
  saveClasses(classes);
}

export function getClasses(): ChessClass[] {
  const data = localStorage.getItem(CLASSES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveClasses(classes: ChessClass[]) {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}

export function getClassesForStudent(studentId: string): ChessClass[] {
  return getClasses().filter(c => c.studentId === studentId);
}

export function updateClass(updatedClass: ChessClass) {
  const classes = getClasses().map(c => 
    c.id === updatedClass.id ? updatedClass : c
  );
  saveClasses(classes);
}

export function addClasses(newClasses: ChessClass[]) {
  const classes = getClasses();
  classes.push(...newClasses);
  saveClasses(classes);
}

/**
 * When a class is cancelled, generate a replacement class
 * scheduled after the last existing class for that student,
 * following the student's regular schedule pattern.
 */
export function cancelClassAndGenerateReplacement(cls: ChessClass): ChessClass | null {
  // Mark as cancelled
  const updated: ChessClass = { ...cls, status: 'cancelled' };
  updateClass(updated);

  const student = getStudents().find(s => s.id === cls.studentId);
  if (!student || student.schedule.length === 0) return null;

  const studentClasses = getClassesForStudent(cls.studentId)
    .filter(c => c.status !== 'cancelled')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Find the last scheduled class date
  const lastClass = studentClasses[studentClasses.length - 1];
  const lastDate = lastClass ? new Date(lastClass.scheduledDate + 'T00:00:00') : new Date();

  // Use the same schedule slot as the cancelled class to find the next occurrence
  // Or just find the next available slot after the last class
  const DAY_MAP: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  };

  // Try each schedule slot, find the earliest date after lastDate
  let bestDate: Date | null = null;
  let bestSlot = student.schedule[0];

  for (const slot of student.schedule) {
    const targetDay = DAY_MAP[slot.day];
    const candidate = new Date(lastDate);
    candidate.setDate(candidate.getDate() + 1); // start from day after last class
    
    // Find next occurrence of targetDay
    while (candidate.getDay() !== targetDay) {
      candidate.setDate(candidate.getDate() + 1);
    }

    if (!bestDate || candidate < bestDate) {
      bestDate = candidate;
      bestSlot = slot;
    }
  }

  if (!bestDate) return null;

  // Convert time using the same logic as scheduler
  const dateStr = bestDate.toISOString().split('T')[0];
  const inputDateStr = `${dateStr}T${bestSlot.time}:00`;
  const inputDate = new Date(inputDateStr);
  
  const getTimezoneOffset = (timezone: string, date: Date): number => {
    const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = date.toLocaleString('en-US', { timeZone: timezone });
    return (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60000;
  };

  const inputOffset = getTimezoneOffset(bestSlot.inputTimezone, inputDate);
  const utcMs = inputDate.getTime() - inputOffset * 60000;
  const teacherOffset = getTimezoneOffset(TEACHER_TIMEZONE, new Date(utcMs));
  const teacherDate = new Date(utcMs + teacherOffset * 60000);
  const studentOffset = getTimezoneOffset(student.timezone, new Date(utcMs));
  const studentDate = new Date(utcMs + studentOffset * 60000);

  const formatTime = (d: Date) => 
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const adjustedDate = teacherDate.toISOString().split('T')[0];
  const allClasses = getClasses();
  const maxId = allClasses.filter(c => c.studentId === cls.studentId).length;

  const newClass: ChessClass = {
    id: `${cls.studentId}-replacement-${Date.now()}`,
    studentId: cls.studentId,
    originalDate: adjustedDate,
    scheduledDate: adjustedDate,
    scheduledTime: formatTime(teacherDate),
    studentTime: formatTime(studentDate),
    status: 'upcoming',
    isRescheduled: false,
  };

  addClasses([newClass]);
  return newClass;
}
