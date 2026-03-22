import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const { user, profile, loading, profileLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && profileLoaded && user) {
    return profile ? <Navigate to="/" replace /> : <Navigate to="/register" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Invalid email or password.");
      return;
    }

    toast.success("Logged in successfully.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(at_40%_20%,#667eea_0px,transparent_50%),radial-gradient(at_80%_0%,#764ba2_0px,transparent_50%),radial-gradient(at_0%_50%,#f97316_0px,transparent_50%),radial-gradient(at_80%_50%,#14b8a6_0px,transparent_50%)]" />
      <div className="w-full max-w-md backdrop-blur-xl bg-white/60 border border-white/20 shadow-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Coach Login</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to manage your classes
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </div>

        <p className="text-xs text-center mt-6 text-muted-foreground">
          Made by Bhomik
        </p>
      </div>
    </div>
  );
};

export default Login;
