import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { COMMON_TIMEZONES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { user, profile, loading, profileLoaded, refreshProfile, signOut } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>(["Chess"]);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && profileLoaded && !user) {
    return <Navigate to="/signup" replace />;
  }

  if (!loading && profileLoaded && profile) {
    return <Navigate to="/" replace />;
  }

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      setSubjectInput("");
      return;
    }
    setSubjects([...subjects, trimmed]);
    setSubjectInput("");
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast.error("No verified user session found.");
      return;
    }

    if (!username.trim()) {
      toast.error("Please enter a username.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (subjects.length === 0) {
      toast.error("Please add at least one subject.");
      return;
    }

    setSubmitting(true);

    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      setSubmitting(false);
      toast.error(passwordError.message || "Failed to set password.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: user.id,
      coach_name: username.trim(),
      subjects,
      timezone,
    });

    if (profileError) {
      setSubmitting(false);
      toast.error(profileError.message || "Failed to create profile.");
      return;
    }

    await refreshProfile();
    setSubmitting(false);
    toast.success("Account setup complete.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(at_40%_20%,#667eea_0px,transparent_50%),radial-gradient(at_80%_0%,#764ba2_0px,transparent_50%),radial-gradient(at_0%_50%,#f97316_0px,transparent_50%),radial-gradient(at_80%_50%,#14b8a6_0px,transparent_50%)]" />

      <div className="w-full max-w-lg backdrop-blur-xl bg-white/60 border border-white/20 shadow-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Complete Registration</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Set up your login and coach profile
          </p>
        </div>

        <form onSubmit={handleCompleteSetup} className="space-y-5">
          <div className="space-y-2">
            <Label>Verified Email</Label>
            <Input value={user?.email ?? ""} disabled className="h-12 rounded-xl bg-muted/60" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-username">Username / Coach Name</Label>
            <Input
              id="register-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Bhomik"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Create Password</Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
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
                placeholder="e.g. Chess, Math, English"
                className="h-12 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
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
            className="w-full h-12 text-base font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Complete account setup"}
          </Button>
        </form>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>

        <p className="text-xs text-center mt-6 text-muted-foreground">
          Made by Bhomik
        </p>
      </div>
    </div>
  );
};

export default Register;
