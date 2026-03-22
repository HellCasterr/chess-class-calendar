import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const { user, profile, loading, profileLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!loading && profileLoaded && user) {
    if (profile) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/register" replace />;
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setSending(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setSending(false);

    if (error) {
      toast.error(error.message || "Failed to send magic link.");
      return;
    }

    setEmailSent(true);
    toast.success("Magic link sent. Check your email.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Class Scheduler</h1>
          </div>
        </div>

        <div className="card-elevated p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Sign in with magic link</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your email and we’ll send you a secure login link.
            </p>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Sending..." : "Send magic link"}
            </Button>
          </form>

          {emailSent && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              Check your inbox and click the magic link to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
