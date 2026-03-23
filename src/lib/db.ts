import { supabase } from '@/integrations/supabase/client';
import { Student, ChessClass } from '@/lib/types';

type StudentRow = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  country: string;
  timezone: string;
  subject: string | null;
  total_classes: number;
  classes_per_week: number;
  schedule: unknown;
  start_date: string;
  created_at: string;
};

type ClassRow = {
  id: string;
  user_id: string;
  student_id: string;
  original_date: string;
  scheduled_date: string;
  scheduled_time: string;
  student_time: string;
  status: string;
  is_rescheduled: boolean;
  created_at: string;
};

function mapStudentRow(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    country: row.country,
    timezone: row.timezone,
    subject: row.subject || '',
    totalClasses: row.total_classes,
    classesPerWeek: row.classes_per_week,
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    startDate: row.start_date,
    createdAt: row.created_at,
  };
}

function mapClassRow(row: ClassRow): ChessClass {
  return {
    id: row.id,
    studentId: row.student_id,
    originalDate: row.original_date,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    studentTime: row.student_time,
    status: row.status as ChessClass['status'],
    isRescheduled: row.is_rescheduled,
  };
}

export async function fetchStudents(userId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data || []) as StudentRow[]).map(mapStudentRow);
}

export async function fetchStudentById(userId: string, studentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .eq('id', studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapStudentRow(data as StudentRow);
}

export async function fetchClasses(userId: string): Promise<ChessClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;

  return ((data || []) as ClassRow[]).map(mapClassRow);
}

export async function fetchClassesForStudent(
  userId: string,
  studentId: string
): Promise<ChessClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .eq('student_id', studentId)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;

  return ((data || []) as ClassRow[]).map(mapClassRow);
}

export async function createStudent(userId: string, student: Student) {
  const { error } = await supabase.from('students').insert({
    id: student.id,
    user_id: userId,
    name: student.name,
    age: student.age,
    country: student.country,
    timezone: student.timezone,
    subject: student.subject || null,
    total_classes: student.totalClasses,
    classes_per_week: student.classesPerWeek,
    schedule: student.schedule,
    start_date: student.startDate,
  });

  if (error) throw error;
}

export async function createClasses(userId: string, classes: ChessClass[]) {
  if (classes.length === 0) return;

  const payload = classes.map((cls) => ({
    id: cls.id,
    user_id: userId,
    student_id: cls.studentId,
    original_date: cls.originalDate,
    scheduled_date: cls.scheduledDate,
    scheduled_time: cls.scheduledTime,
    student_time: cls.studentTime,
    status: cls.status,
    is_rescheduled: cls.isRescheduled,
  }));

  const { error } = await supabase.from('classes').insert(payload);

  if (error) throw error;
}

export async function updateClassRecord(userId: string, cls: ChessClass) {
  const { error } = await supabase
    .from('classes')
    .update({
      original_date: cls.originalDate,
      scheduled_date: cls.scheduledDate,
      scheduled_time: cls.scheduledTime,
      student_time: cls.studentTime,
      status: cls.status,
      is_rescheduled: cls.isRescheduled,
    })
    .eq('id', cls.id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteStudentRecord(userId: string, studentId: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteClassRecord(userId: string, classId: string) {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)
    .eq('user_id', userId);

  if (error) throw error;
}
