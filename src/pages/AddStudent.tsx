import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStudent, createClasses, deleteStudentRecord } from '@/lib/db';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Student, DayOfWeek, DAYS_OF_WEEK, COMMON_TIMEZONES } from '@/lib/types';
import { generateClasses } from '@/lib/scheduler';
import { createStudent, createClasses } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AddStudent = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [totalClasses, setTotalClasses] = useState('');
  const [subject, setSubject] = useState(profile?.subjects?.[0] || '');
  const [classesPerWeek, setClassesPerWeek] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputTimezone, setInputTimezone] = useState(profile?.timezone || '');
  const [scheduleSlots, setScheduleSlots] = useState<{ day: DayOfWeek; time: string }[]>([
    { day: 'monday', time: '14:00' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addSlot = () => {
    if (scheduleSlots.length < 7) {
      setScheduleSlots([...scheduleSlots, { day: 'wednesday', time: '14:00' }]);
    }
  };

  const removeSlot = (index: number) => {
    setScheduleSlots(scheduleSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: 'day' | 'time', value: string) => {
    const updated = [...scheduleSlots];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleSlots(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    toast.error('You must be signed in.');
    return;
  }

  if (!name.trim() || !age || !country.trim() || !timezone || !totalClasses || !classesPerWeek) {
    toast.error('Please fill all required fields.');
    return;
  }

  if (scheduleSlots.length === 0) {
    toast.error('Please add at least one schedule slot.');
    return;
  }

  if (Number(classesPerWeek) !== scheduleSlots.length) {
    toast.error('Classes per week should match the number of weekly schedule slots.');
    return;
  }

  setSubmitting(true);

  try {
    const student: Student = {
      id: crypto.randomUUID(),
      name: name.trim(),
      age: parseInt(age, 10),
      country: country.trim(),
      timezone,
      subject: subject.trim(),
      totalClasses: parseInt(totalClasses, 10),
      classesPerWeek: parseInt(classesPerWeek, 10),
      schedule: scheduleSlots.map((s) => ({
        ...s,
        inputTimezone: inputTimezone || timezone,
      })),
      createdAt: new Date().toISOString(),
      startDate,
    };

    // Generate classes FIRST so we fail before writing student if scheduler throws
    const classes = generateClasses(student);

    // Then write student
    await createStudent(user.id, student);

    try {
      // Then write classes
      await createClasses(user.id, classes);
    } catch (classError) {
      // Roll back student if class insert fails
      await deleteStudentRecord(user.id, student.id);
      throw classError;
    }

    toast.success('Student added successfully.');
    navigate('/');
  } catch (error: any) {
    console.error('ADD STUDENT ERROR:', error);
    toast.error(error?.message || 'Failed to save student.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">Add Student</h1>
            <p className="text-sm text-muted-foreground">
              Create a student profile and generate their class schedule
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Student information</h2>
              <p className="text-sm text-muted-foreground">
                Add the student’s basic details and teaching preferences.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-2xl border bg-background/50 p-5 space-y-4">
                <h3 className="font-medium">Basic details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="3"
                      max="99"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 10"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    {profile && profile.subjects.length > 0 ? (
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {profile.subjects.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Chess"
                        className="h-12 rounded-xl"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. UAE"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Student Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone} required>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-background/50 p-5 space-y-4">
                <h3 className="font-medium">Class plan</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalClasses">Total Classes</Label>
                    <Input
                      id="totalClasses"
                      type="number"
                      min="1"
                      value={totalClasses}
                      onChange={(e) => setTotalClasses(e.target.value)}
                      placeholder="e.g. 24"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perWeek">Classes per Week</Label>
                    <Select value={classesPerWeek} onValueChange={setClassesPerWeek}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x per week
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-background/50 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">Weekly schedule</h3>
                    <p className="text-sm text-muted-foreground">
                      Add one slot per class each week. Keep this equal to “Classes per Week”.
                    </p>
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={addSlot} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Slot
                  </Button>
                </div>

                <div className="space-y-2 mb-2">
                  <Label>I’m entering times in</Label>
                  <Select value={inputTimezone} onValueChange={setInputTimezone}>
                    <SelectTrigger className="max-w-sm h-12 rounded-xl">
                      <SelectValue placeholder="Select input timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {scheduleSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border bg-card px-4 py-4 flex flex-col sm:flex-row sm:items-end gap-3"
                    >
                      <div className="flex-1 space-y-2">
                        <Label>Day</Label>
                        <Select value={slot.day} onValueChange={(v) => updateSlot(index, 'day', v)}>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day} value={day} className="capitalize">
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1 space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={slot.time}
                          onChange={(e) => updateSlot(index, 'time', e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>

                      {scheduleSlots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(index)}
                          className="text-destructive hover:text-destructive rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-xl w-full sm:w-auto active:scale-[0.98] transition-transform"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Register Student & Generate Schedule'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-xl w-full sm:w-auto"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </AppShell>
  );
};

export default AddStudent;
