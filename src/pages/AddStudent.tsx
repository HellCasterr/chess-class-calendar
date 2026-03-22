import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Student, ScheduleSlot, DayOfWeek, DAYS_OF_WEEK, COMMON_TIMEZONES } from '@/lib/types';
import { addStudent } from '@/lib/store';
import { generateClasses } from '@/lib/scheduler';
import { addClasses } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const AddStudent = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [totalClasses, setTotalClasses] = useState('');
  const [subject, setSubject] = useState(profile?.subjects?.[0] || '');
  const [classesPerWeek, setClassesPerWeek] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputTimezone, setInputTimezone] = useState('');
  const [scheduleSlots, setScheduleSlots] = useState<{ day: DayOfWeek; time: string }[]>([
    { day: 'monday', time: '14:00' }
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const student: Student = {
      id: crypto.randomUUID(),
      name,
      age: parseInt(age),
      country,
      timezone,
      subject,
      totalClasses: parseInt(totalClasses),
      classesPerWeek: parseInt(classesPerWeek),
      schedule: scheduleSlots.map(s => ({
        ...s,
        inputTimezone: inputTimezone || timezone,
      })),
      createdAt: new Date().toISOString(),
      startDate,
    };

    addStudent(student);
    const classes = generateClasses(student);
    addClasses(classes);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold mb-2 text-balance">Register New Student</h1>
          <p className="text-muted-foreground mb-8">Add a student and set up their class schedule.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold">Student Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bhomik" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min="3" max="99" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 7" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. UAE" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Student's Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Class Details */}
            <div className="card-elevated p-6 space-y-4" style={{ animationDelay: '80ms' }}>
              <h2 className="text-lg font-semibold">Class Details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalClasses">Total Classes</Label>
                  <Input id="totalClasses" type="number" min="1" value={totalClasses} onChange={e => setTotalClasses(e.target.value)} placeholder="e.g. 24" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perWeek">Classes per Week</Label>
                  <Select value={classesPerWeek} onValueChange={setClassesPerWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}x per week</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card-elevated p-6 space-y-4" style={{ animationDelay: '160ms' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Weekly Schedule</h2>
                <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                  <Plus className="w-4 h-4 mr-1" /> Add Slot
                </Button>
              </div>

              <div className="space-y-2 mb-4">
                <Label>I'm entering times in</Label>
                <Select value={inputTimezone} onValueChange={setInputTimezone}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Select input timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scheduleSlots.map((slot, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Day</Label>
                    <Select value={slot.day} onValueChange={(v) => updateSlot(index, 'day', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(day => (
                          <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={slot.time} onChange={e => updateSlot(index, 'time', e.target.value)} />
                  </div>
                  {scheduleSlots.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(index)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" size="lg" className="w-full active:scale-[0.98] transition-transform">
              Register Student & Generate Schedule
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
