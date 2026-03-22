import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Register = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, signOut } = useAuth();

  const [coachName, setCoachName] = useState("");
  const [subjectsText, setSubjectsText] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be signed in to complete registration.");
      navigate("/auth", { replace: true });
      return;
    }

    const subjects = subjectsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!coachName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (subjects.length === 0) {
      toast.error("Please enter at least one subject.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      coach_name: coachName.trim(),
      subjects,
      timezone,
    });

    if (error) {
      setSubmitting(false);
      toast.error(error.message || "Failed to create profile.");
      return;
    }

    await refreshProfile();
    setSubmitting(false);
    toast.success("Registration complete.");
    navigate("/", { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg card-elevated p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Complete your registration</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome. Set up your coach profile to continue to your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="coachName">Coach name</Label>
            <Input
              id="coachName"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              placeholder="e.g. Bhomik"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjects">Subjects</Label>
            <Input
              id="subjects"
              value={subjectsText}
              onChange={(e) => setSubjectsText(e.target.value)}
              placeholder="e.g. Chess, Math, English"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter one or more subjects, separated by commas.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
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

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Finish registration"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSignOut}
              disabled={submitting}
            >
              Sign out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
