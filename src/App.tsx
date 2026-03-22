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
import JobDetail from "./pages/JobDetail";
import CustomerPortal from "./pages/CustomerPortal";
import NotFound from "./pages/NotFound";
import BackupDatabase from "./pages/BackupDatabase";
import DueBill from "./pages/collection/DueBill";
import ExpenseCategory from "./pages/expense-income/ExpenseCategory";
import Expenses from "./pages/expense-income/Expenses";
import IncomeCategory from "./pages/expense-income/IncomeCategory";
import Income from "./pages/expense-income/Income";
import CustomerLedger from "./pages/ledger/CustomerLedger";
import ChartOfAccounts from "./pages/accounts/ChartOfAccounts";

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
      <Route path="/track" element={<CustomerPortal />} />
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
      <Route path="/job-list" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
      <Route path="/job/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      <Route path="/backup" element={<ProtectedRoute><BackupDatabase /></ProtectedRoute>} />
      <Route path="/collection/due-bill" element={<ProtectedRoute><DueBill /></ProtectedRoute>} />
      <Route path="/expense-income/expense-category" element={<ProtectedRoute><ExpenseCategory /></ProtectedRoute>} />
      <Route path="/expense-income/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/expense-income/income-category" element={<ProtectedRoute><IncomeCategory /></ProtectedRoute>} />
      <Route path="/expense-income/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
      <Route path="/ledger/customer" element={<ProtectedRoute><CustomerLedger /></ProtectedRoute>} />
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
