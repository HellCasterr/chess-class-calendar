import { Student, ChessClass } from './types';

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
