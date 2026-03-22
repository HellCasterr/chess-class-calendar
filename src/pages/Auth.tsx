import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMMON_TIMEZONES } from '@/lib/types';
import { BookOpen, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachName, setCoachName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [subjects, setSubjects] = useState<string[]>(['Chess']);
  const [newSubject, setNewSubject] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setNewSubject('');
    }
  };

  const removeSubject = (s: string) => {
    setSubjects(subjects.filter(sub => sub !== s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!coachName.trim() || subjects.length === 0) {
          toast.error('Please fill in your name and at least one subject.');
          setSubmitting(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: data.user.id,
            coach_name: coachName.trim(),
            subjects,
            timezone,
          });
          if (profileError) throw profileError;
        }

        toast.success('Account created! Check your email to verify, or log in directly.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Logged in!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Class Scheduler</h1>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignUp ? 'Set up your coaching profile' : 'Sign in to your dashboard'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coach@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="coachName">Your Name</Label>
                  <Input
                    id="coachName"
                    value={coachName}
                    onChange={e => setCoachName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subjects You Teach</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {subjects.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {s}
                        <button type="button" onClick={() => removeSubject(s)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder="e.g. Math, Piano, Chess"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubject(); } }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSubject}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full active:scale-[0.98] transition-transform" disabled={submitting}>
              {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
