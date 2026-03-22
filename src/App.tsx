import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RepairProvider } from "@/context/RepairContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import RepairDetail from "./pages/RepairDetail";
import Customers from "./pages/Customers";
import CalendarView from "./pages/CalendarView";
import SmsSettings from "./pages/SmsSettings";
import Login from "./pages/Login";
import UserList from "./pages/admin/UserList";
import AddUser from "./pages/admin/AddUser";
import EditUser from "./pages/admin/EditUser";
import UserLogs from "./pages/admin/UserLogs";
import MyProfile from "./pages/MyProfile";
import BranchList from "./pages/branch/BranchList";
import AddBranch from "./pages/branch/AddBranch";
import EditBranch from "./pages/branch/EditBranch";
import BrandList from "./pages/machine-data/BrandList";
import ModelList from "./pages/machine-data/ModelList";
import BoardList from "./pages/machine-data/BoardList";
import AddJob from "./pages/AddJob";
import JobList from "./pages/JobList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user && !loading ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/repair/:id" element={<ProtectedRoute><RepairDetail /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
      <Route path="/sms-settings" element={<ProtectedRoute><SmsSettings /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/admin/add-user" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
      <Route path="/admin/edit-user/:id" element={<ProtectedRoute><EditUser /></ProtectedRoute>} />
      <Route path="/admin/user-logs" element={<ProtectedRoute><UserLogs /></ProtectedRoute>} />
      <Route path="/branch/list" element={<ProtectedRoute><BranchList /></ProtectedRoute>} />
      <Route path="/branch/add" element={<ProtectedRoute><AddBranch /></ProtectedRoute>} />
      <Route path="/branch/edit/:id" element={<ProtectedRoute><EditBranch /></ProtectedRoute>} />
      <Route path="/machine-data/brands" element={<ProtectedRoute><BrandList /></ProtectedRoute>} />
      <Route path="/machine-data/models" element={<ProtectedRoute><ModelList /></ProtectedRoute>} />
      <Route path="/machine-data/boards" element={<ProtectedRoute><BoardList /></ProtectedRoute>} />
      <Route path="/add-job" element={<ProtectedRoute><AddJob /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RepairProvider>
            <AppRoutes />
          </RepairProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
