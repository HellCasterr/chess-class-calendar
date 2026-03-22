import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AddStudent from "./pages/AddStudent";
import StudentDetail from "./pages/StudentDetail";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const FullScreenMessage = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">
    {message}
  </div>
);

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenMessage message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const RequireProfile = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, profileLoaded, loading } = useAuth();

  if (loading || !profileLoaded) {
    return <FullScreenMessage message="Loading profile..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

const RegisterRoute = () => {
  const { user, profile, profileLoaded, loading } = useAuth();

  if (loading || !profileLoaded) {
    return <FullScreenMessage message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile) {
    return <Navigate to="/" replace />;
  }

  return <Register />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/register" element={<RegisterRoute />} />

    <Route
      path="/"
      element={
        <RequireAuth>
          <RequireProfile>
            <Index />
          </RequireProfile>
        </RequireAuth>
      }
    />

    <Route
      path="/add-student"
      element={
        <RequireAuth>
          <RequireProfile>
            <AddStudent />
          </RequireProfile>
        </RequireAuth>
      }
    />

    <Route
      path="/student/:id"
      element={
        <RequireAuth>
          <RequireProfile>
            <StudentDetail />
          </RequireProfile>
        </RequireAuth>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
