export interface Student {
  id: string;
  name: string;
  age: number;
  country: string;
  timezone: string;
  totalClasses: number;
  classesPerWeek: number;
  schedule: ScheduleSlot[];
  createdAt: string;
  startDate: string; // when classes begin (can be in the past)
}

export interface ScheduleSlot {
  day: DayOfWeek;
  time: string; // HH:mm in the input timezone
  inputTimezone: string; // timezone used when entering the time
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ChessClass {
  id: string;
  studentId: string;
  originalDate: string; // ISO date
  scheduledDate: string; // ISO date (may differ if rescheduled)
  scheduledTime: string; // HH:mm in teacher's timezone (IST)
  studentTime: string; // HH:mm in student's timezone
  status: 'completed' | 'upcoming' | 'rescheduled' | 'cancelled';
  isRescheduled: boolean;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'UAE (GST, UTC+4)' },
  { value: 'America/New_York', label: 'US Eastern (ET)' },
  { value: 'America/Chicago', label: 'US Central (CT)' },
  { value: 'America/Denver', label: 'US Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PT)' },
  { value: 'Europe/London', label: 'UK (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Central Europe (CET)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST, UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia Eastern (AEST)' },
  { value: 'Asia/Riyadh', label: 'Saudi Arabia (AST, UTC+3)' },
  { value: 'America/Toronto', label: 'Canada Eastern (ET)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (MYT, UTC+8)' },
  { value: 'Africa/Lagos', label: 'Nigeria (WAT, UTC+1)' },
];

export const TEACHER_TIMEZONE = 'Asia/Kolkata';
