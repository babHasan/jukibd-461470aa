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
import BulkSms from "./pages/BulkSms";
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
import EditJob from "./pages/EditJob";
import CustomerPortal from "./pages/CustomerPortal";
import ChallanVerify from "./pages/ChallanVerify";
import NotFound from "./pages/NotFound";
import BackupDatabase from "./pages/BackupDatabase";
import DueBill from "./pages/collection/DueBill";
import ExpenseCategory from "./pages/expense-income/ExpenseCategory";
import Expenses from "./pages/expense-income/Expenses";
import IncomeCategory from "./pages/expense-income/IncomeCategory";
import Income from "./pages/expense-income/Income";
import CustomerLedger from "./pages/ledger/CustomerLedger";
import ChartOfAccounts from "./pages/accounts/ChartOfAccounts";
import TransactionReport from "./pages/reports/TransactionReport";
import CollectionReport from "./pages/reports/CollectionReport";
import ExpenseReport from "./pages/reports/ExpenseReport";
import CompanyWiseReport from "./pages/reports/CompanyWiseReport";
import UserWiseReport from "./pages/reports/UserWiseReport";
import CompanyInfo from "./pages/settings/CompanyInfo";
import PrintInvoice from "./pages/PrintInvoice";
import PortalScrollMessage from "./pages/settings/PortalScrollMessage";
import FooterSettings from "./pages/settings/FooterSettings";
import AppearanceSettings from "./pages/settings/AppearanceSettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import CashIn from "./pages/cashbook/CashIn";
import CashOut from "./pages/cashbook/CashOut";
import BalanceSheet from "./pages/cashbook/BalanceSheet";
import InventoryList from "./pages/inventory/InventoryList";
import WarrantyList from "./pages/warranty/WarrantyList";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import CustomerFeedback from "./pages/feedback/CustomerFeedback";
import QrScanner from "./pages/QrScanner";
import TallyExport from "./pages/TallyExport";
import { ThemeProvider } from "@/context/ThemeContext";

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
      <Route path="/bulk-sms" element={<ProtectedRoute><BulkSms /></ProtectedRoute>} />
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
      <Route path="/job/:id/edit" element={<ProtectedRoute><EditJob /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      <Route path="/backup" element={<ProtectedRoute><BackupDatabase /></ProtectedRoute>} />
      <Route path="/collection/due-bill" element={<ProtectedRoute><DueBill /></ProtectedRoute>} />
      <Route path="/collection/report" element={<ProtectedRoute><CollectionReport /></ProtectedRoute>} />
      <Route path="/expense-income/expense-category" element={<ProtectedRoute><ExpenseCategory /></ProtectedRoute>} />
      <Route path="/expense-income/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/expense-income/income-category" element={<ProtectedRoute><IncomeCategory /></ProtectedRoute>} />
      <Route path="/expense-income/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
      <Route path="/ledger/customer" element={<ProtectedRoute><CustomerLedger /></ProtectedRoute>} />
      <Route path="/accounts/chart" element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
      <Route path="/reports/transaction" element={<ProtectedRoute><TransactionReport /></ProtectedRoute>} />
      <Route path="/reports/collection" element={<ProtectedRoute><CollectionReport /></ProtectedRoute>} />
      <Route path="/reports/expense" element={<ProtectedRoute><ExpenseReport /></ProtectedRoute>} />
      <Route path="/reports/company-wise" element={<ProtectedRoute><CompanyWiseReport /></ProtectedRoute>} />
      <Route path="/reports/user-wise" element={<ProtectedRoute><UserWiseReport /></ProtectedRoute>} />
      <Route path="/challan-verify" element={<ProtectedRoute><ChallanVerify /></ProtectedRoute>} />
      <Route path="/settings/company-info" element={<ProtectedRoute><CompanyInfo /></ProtectedRoute>} />
      <Route path="/settings/portal-message" element={<ProtectedRoute><PortalScrollMessage /></ProtectedRoute>} />
      <Route path="/settings/footer" element={<ProtectedRoute><FooterSettings /></ProtectedRoute>} />
      <Route path="/settings/appearance" element={<ProtectedRoute><AppearanceSettings /></ProtectedRoute>} />
      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/cashbook/cash-in" element={<ProtectedRoute><CashIn /></ProtectedRoute>} />
      <Route path="/cashbook/cash-out" element={<ProtectedRoute><CashOut /></ProtectedRoute>} />
      <Route path="/cashbook/balance" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
      <Route path="/print-invoice" element={<ProtectedRoute><PrintInvoice /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
      <Route path="/warranty" element={<ProtectedRoute><WarrantyList /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><CustomerFeedback /></ProtectedRoute>} />
      <Route path="/qr-scanner" element={<ProtectedRoute><QrScanner /></ProtectedRoute>} />
      <Route path="/tally-export" element={<ProtectedRoute><TallyExport /></ProtectedRoute>} />
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
          <ThemeProvider>
            <RepairProvider>
              <AppRoutes />
            </RepairProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
