import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Signup = () => {
  const { user, profile, loading, profileLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!loading && profileLoaded && user) {
    return profile ? <Navigate to="/" replace /> : <Navigate to="/register" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        shouldCreateUser: true,
      },
    });

    setSending(false);

    if (error) {
      toast.error(error.message || "Failed to send verification link.");
      return;
    }

    setSent(true);
    toast.success("Verification link sent.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(at_40%_20%,#667eea_0px,transparent_50%),radial-gradient(at_80%_0%,#764ba2_0px,transparent_50%),radial-gradient(at_0%_50%,#f97316_0px,transparent_50%),radial-gradient(at_80%_50%,#14b8a6_0px,transparent_50%)]" />
      <div className="w-full max-w-md backdrop-blur-xl bg-white/60 border border-white/20 shadow-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Verify your email to start setting up your coach account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send verification link"}
          </Button>
        </form>

        {sent && (
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Check your inbox and click the verification link.
          </p>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>

        <p className="text-xs text-center mt-6 text-muted-foreground">
          Made by Bhomik
        </p>
      </div>
    </div>
  );
};

export default Signup;
