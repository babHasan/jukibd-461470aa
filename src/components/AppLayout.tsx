import { Footer } from "@/components/Footer";
import { SearchJobWizard } from "@/components/SearchJobWizard";
import { useAuth } from "@/context/AuthContext";
import {
  Wrench,
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Shield,
  GitBranch,
  Monitor,
  UserCircle,
  PlusCircle,
  Plus,
  ClipboardList,
  Diamond,
  DollarSign,
  BookOpen,
  FileText,
  Wallet,
  CheckCheck,
  Settings,
  Database,
  LogOut,
  UserPlus,
  Lock,
  Building,
  MapPin,
  Laptop,
  Smartphone,
  HardDrive,
  FolderOpen,
  Receipt,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  CreditCard,
  Banknote,
  Bell,
  Palette,
  Megaphone,
  Package,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface SubItem {
  to: string;
  label: string;
  icon: any;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  children?: SubItem[];
}

const navItems: NavItem[] = [
  { to: "/", label: "DASHBOARD", icon: LayoutDashboard },
  {
    to: "/admin",
    label: "ADMIN",
    icon: Shield,
    children: [
      { to: "/admin/users", label: "User List", icon: Users },
      { to: "/admin/add-user", label: "Add User", icon: UserPlus },
      { to: "/admin/user-logs", label: "User Logs", icon: FileText },
    ],
  },
  {
    to: "/branch",
    label: "BRANCH",
    icon: GitBranch,
    children: [
      { to: "/branch/list", label: "Branch List", icon: Building },
      { to: "/branch/add", label: "Add Branch", icon: PlusCircle },
    ],
  },
  {
    to: "/machine-data",
    label: "MACHINE DATA",
    icon: Monitor,
    children: [
      { to: "/machine-data/brands", label: "Brands", icon: Laptop },
      { to: "/machine-data/models", label: "Models", icon: Smartphone },
      { to: "/machine-data/boards", label: "Boards", icon: HardDrive },
    ],
  },
  {
    to: "/customers",
    label: "CLIENT DATA",
    icon: UserCircle,
  },
  { to: "/add-job", label: "ADD JOB", icon: PlusCircle },
  { to: "/job-list", label: "JOB LIST", icon: ClipboardList },
  {
    to: "/collection",
    label: "COLLECTION",
    icon: Diamond,
    children: [
      { to: "/collection/due-bill", label: "Due Bill", icon: Banknote },
      { to: "/collection/report", label: "Collection Report", icon: CreditCard },
    ],
  },
  {
    to: "/expense-income",
    label: "EXPENSE / INCOME",
    icon: DollarSign,
    children: [
      { to: "/expense-income/expense-category", label: "Expense Category", icon: FolderOpen },
      { to: "/expense-income/expenses", label: "Expense", icon: TrendingDown },
      { to: "/expense-income/income-category", label: "Income Category", icon: FolderOpen },
      { to: "/expense-income/income", label: "Income", icon: TrendingUp },
    ],
  },
  {
    to: "/ledger",
    label: "LEDGER",
    icon: BookOpen,
    children: [
      { to: "/ledger/customer", label: "Customer Ledger", icon: UserCircle },
    ],
  },
  {
    to: "/reports",
    label: "REPORTS",
    icon: FileText,
    children: [
      { to: "/reports/transaction", label: "Transaction Report", icon: Receipt },
      { to: "/reports/collection", label: "Collection", icon: CreditCard },
      { to: "/reports/expense", label: "Expense", icon: TrendingDown },
      { to: "/reports/company-wise", label: "Company Wise", icon: FileText },
      { to: "/reports/user-wise", label: "User Wise", icon: Users },
    ],
  },
  {
    to: "/cashbook",
    label: "CASHBOOK",
    icon: Wallet,
    children: [
      { to: "/cashbook/cash-in", label: "Cash In", icon: TrendingUp },
      { to: "/cashbook/cash-out", label: "Cash Out", icon: TrendingDown },
      { to: "/cashbook/balance", label: "Balance Sheet", icon: Banknote },
    ],
  },
  {
    to: "/accounts",
    label: "ACCOUNTS",
    icon: BookOpen,
    children: [
      { to: "/accounts/chart", label: "Chart of Accounts", icon: FileText },
    ],
  },
  { to: "/challan-verify", label: "CHALLAN VERIFY", icon: CheckCheck },
  {
    to: "/settings",
    label: "SETTING",
    icon: Settings,
    children: [
      { to: "/settings/company-info", label: "Company Info", icon: Building },
      { to: "/sms-settings", label: "SMS Settings", icon: MessageSquare },
      { to: "/bulk-sms", label: "Bulk SMS / ঘোষণা", icon: Megaphone },
      { to: "/settings/portal-message", label: "Portal Scroll Message", icon: MessageSquare },
      { to: "/settings/footer", label: "Footer Settings", icon: FileText },
      { to: "/settings/notifications", label: "Notifications", icon: Bell },
      { to: "/settings/appearance", label: "Appearance", icon: Palette },
    ],
  },
  { to: "/backup", label: "BACKUP DATABASE", icon: Database },
];

function SidebarItem({
  item,
  collapsed,
  currentPath,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
  onNavigate: () => void;
}) {
  const isChildActive = item.children?.some((c) => currentPath === c.to) ?? false;
  const isActive = currentPath === item.to || isChildActive;
  const [open, setOpen] = useState(isChildActive);

  if (!item.children || collapsed) {
    return (
      <Link
        to={item.children ? item.children[0].to : item.to}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-blue-600/90 to-blue-500/80 text-white shadow-lg shadow-blue-500/20"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`}
        style={{ fontSize: "var(--menu-font-size, 13px)" }}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
        {!collapsed && <span className="flex-1">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-blue-600/90 to-blue-500/80 text-white shadow-lg shadow-blue-500/20"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`}
        style={{ fontSize: "var(--menu-font-size, 13px)" }}
      >
        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => {
            const childActive = currentPath === child.to;
            return (
              <Link
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-medium transition-all duration-200 ${
                  childActive
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
                style={{ fontSize: "var(--submenu-font-size, 12px)" }}
              >
                <child.icon className={`h-3.5 w-3.5 shrink-0 ${childActive ? "text-blue-400" : ""}`} />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Map nav labels to permission module names
const navPermissionMap: Record<string, string> = {
  "DASHBOARD": "Dashboard",
  "BRANCH": "Branch",
  "MACHINE DATA": "Machine Data",
  "CLIENT DATA": "Client Data",
  "ADD JOB": "Add Job",
  "JOB LIST": "Job List",
  "COLLECTION": "Collection",
  "EXPENSE / INCOME": "Expense / Income",
  "LEDGER": "Ledger",
  "REPORTS": "Reports",
  "CASHBOOK": "Cashbook",
  "CHALLAN VERIFY": "Challan Verify",
  "ACCOUNTS": "Accounts",
  "SETTING": "Setting",
  "BACKUP DATABASE": "Backup Database",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  const { signOut, user, isAdmin, permissions } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; photo_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("name, photo_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const currentLabel =
    navItems.find((n) => n.to === location.pathname)?.label ||
    navItems.flatMap((n) => n.children || []).find((c) => c.to === location.pathname)?.label ||
    "RepairDesk";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 lg:relative ${
          collapsed ? "w-16" : "w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "linear-gradient(180deg, #0a0f1e 0%, #111936 50%, #0d1428 100%)" }}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-white">
              RepairDesk
            </span>
          )}
        </div>

        {/* User Profile Mini Card */}
        {!collapsed && profile && (
          <Link to="/my-profile" className="mx-3 mt-4 mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 hover:bg-white/8 transition-colors">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0 ring-2 ring-white/10">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile?.name?.[0] || "U").toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.name || "User"}</p>
              <p className="text-[11px] text-slate-500 truncate">{isAdmin ? "Administrator" : "Staff"}</p>
            </div>
          </Link>
        )}

        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-3 scrollbar-thin">
          {navItems
            .filter((item) => {
              if (isAdmin) return true;
              if (item.label === "ADMIN") return false;
              const requiredModule = navPermissionMap[item.label];
              if (!requiredModule) return true;
              return permissions.includes(requiredModule);
            })
            .map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                collapsed={collapsed}
                currentPath={location.pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
        </nav>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 mx-3 mb-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-white/5"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>LOG OUT</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center border-t border-white/5 py-3 text-slate-500 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/add-job" className="gap-1.5 sm:gap-2 bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium h-8 sm:h-10 px-2.5 sm:px-4 py-1.5 sm:py-2">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">New Job</span>
              <span className="xs:hidden">+</span>
            </Link>
            <Link to="/my-profile" className="flex items-center gap-2 rounded-full bg-primary px-2 sm:px-3 py-1 sm:py-1.5 hover:opacity-90 transition-opacity">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-accent flex items-center justify-center text-[10px] sm:text-xs font-bold text-accent-foreground overflow-hidden shrink-0">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (profile?.name?.[0] || (isAdmin ? "A" : "U")).toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-primary-foreground">{profile?.name || (isAdmin ? "ADMIN" : "USER")}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-16">{children}</main>
        <Footer />
      </div>
      <SearchJobWizard />
    </div>
  );
}
