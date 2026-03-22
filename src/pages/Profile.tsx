import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { COMMON_TIMEZONES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, UserCircle2, Lock, Clock3, X } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, profileLoaded, refreshProfile } = useAuth();

  const [coachName, setCoachName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setCoachName(profile.coach_name || '');
      setTimezone(profile.timezone || 'Asia/Kolkata');
      setSubjects(Array.isArray(profile.subjects) ? profile.subjects : []);
    }
  }, [profile]);

  const currentTimePreview = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: timezone,
      timeZoneName: 'short',
    }).format(new Date());
  }, [timezone]);

  if (!loading && profileLoaded && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && profileLoaded && !profile) {
    return <Navigate to="/register" replace />;
  }

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      setSubjectInput('');
      return;
    }
    setSubjects([...subjects, trimmed]);
    setSubjectInput('');
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error('Profile not available.');
      return;
    }

    if (!coachName.trim()) {
      toast.error('Please enter coach name.');
      return;
    }

    if (subjects.length === 0) {
      toast.error('Please add at least one subject.');
      return;
    }

    setSavingProfile(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        coach_name: coachName.trim(),
        timezone,
        subjects,
      })
      .eq('user_id', user.id);

    setSavingProfile(false);

    if (error) {
      toast.error(error.message || 'Failed to update profile.');
      return;
    }

    await refreshProfile();
    toast.success('Profile updated.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSavingPassword(false);

    if (error) {
      toast.error(error.message || 'Failed to update password.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated.');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm shrink-0">
              <UserCircle2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Coach Profile</h1>
              <p className="text-xs text-muted-foreground">
                Manage your personal details and account settings
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Personal information</h2>
            <p className="text-sm text-muted-foreground">
              Update how your coaching profile appears across the app.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="h-12 rounded-xl bg-muted/60" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach-name">Coach Name</Label>
              <Input
                id="coach-name"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder="e.g. Bhomik"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Your Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
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
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock3 className="w-3.5 h-3.5" />
                Current time in this timezone: {currentTimePreview}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Subjects You Teach</Label>

              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <span
                    key={subject}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeSubject(subject)}
                      className="opacity-70 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Add a subject"
                  className="h-12 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubject();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSubject} className="h-12 rounded-xl">
                  Add
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="rounded-xl"
              disabled={savingProfile}
            >
              <Save className="w-4 h-4 mr-2" />
              {savingProfile ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">
              Change your password for future email/password logins.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="rounded-xl"
              disabled={savingPassword}
            >
              <Lock className="w-4 h-4 mr-2" />
              {savingPassword ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Profile;
