import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Auth = () => {
  const { user, profile, loading, profileLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!loading && profileLoaded && user) {
    return profile ? <Navigate to="/" /> : <Navigate to="/register" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setSending(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Magic link sent 🚀");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* 🔥 Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(at_40%_20%,#667eea_0px,transparent_50%),radial-gradient(at_80%_0%,#764ba2_0px,transparent_50%),radial-gradient(at_0%_50%,#f97316_0px,transparent_50%),radial-gradient(at_80%_50%,#14b8a6_0px,transparent_50%)]"></div>

      {/* 🔥 Glass Card */}
      <div className="w-full max-w-md backdrop-blur-xl bg-white/60 border border-white/20 shadow-2xl rounded-3xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Coach Login
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your classes like a pro
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-base rounded-xl"
          />

          <Button
            className="w-full h-12 text-base font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        {/* Feedback */}
        {sent && (
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Check your email to continue
          </p>
        )}

        {/* Footer */}
        <p className="text-xs text-center mt-6 text-muted-foreground">
          Made by Bhomik
        </p>
      </div>
    </div>
  );
};

export default Auth;
