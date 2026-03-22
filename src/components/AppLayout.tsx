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
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ReactNode, useState } from "react";
import { AddRepairDialog } from "@/components/AddRepairDialog";
import { useRepairs } from "@/context/RepairContext";

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
      { to: "/admin/roles", label: "Roles & Permissions", icon: Lock },
    ],
  },
  {
    to: "/branch",
    label: "BRANCH",
    icon: GitBranch,
    children: [
      { to: "/branch/list", label: "Branch List", icon: Building },
      { to: "/branch/add", label: "Add Branch", icon: PlusCircle },
      { to: "/branch/areas", label: "Service Areas", icon: MapPin },
    ],
  },
  {
    to: "/machine-data",
    label: "MACHINE DATA",
    icon: Monitor,
    children: [
      { to: "/machine-data/brands", label: "Brands", icon: Laptop },
      { to: "/machine-data/models", label: "Models", icon: Smartphone },
      { to: "/machine-data/parts", label: "Parts Inventory", icon: HardDrive },
    ],
  },
  {
    to: "/customers",
    label: "CLIENT DATA",
    icon: UserCircle,
    children: [
      { to: "/customers", label: "All Clients", icon: Users },
      { to: "/customers/add", label: "Add Client", icon: UserPlus },
    ],
  },
  { to: "/add-job", label: "ADD JOB", icon: PlusCircle },
  { to: "/job-list", label: "JOB LIST", icon: ClipboardList },
  {
    to: "/collection",
    label: "COLLECTION",
    icon: Diamond,
    children: [
      { to: "/collection/pending", label: "Pending", icon: Receipt },
      { to: "/collection/received", label: "Received", icon: CreditCard },
    ],
  },
  {
    to: "/expense-income",
    label: "EXPENSE / INCOME",
    icon: DollarSign,
    children: [
      { to: "/expense-income/expenses", label: "Expenses", icon: TrendingDown },
      { to: "/expense-income/income", label: "Income", icon: TrendingUp },
    ],
  },
  {
    to: "/ledger",
    label: "LEDGER",
    icon: BookOpen,
    children: [
      { to: "/ledger/general", label: "General Ledger", icon: FolderOpen },
      { to: "/ledger/accounts", label: "Chart of Accounts", icon: FileText },
    ],
  },
  {
    to: "/reports",
    label: "REPORTS",
    icon: FileText,
    children: [
      { to: "/reports/daily", label: "Daily Report", icon: BarChart3 },
      { to: "/reports/monthly", label: "Monthly Report", icon: PieChart },
      { to: "/reports/revenue", label: "Revenue Report", icon: TrendingUp },
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
  { to: "/challan-verify", label: "CHALLAN VERIFY", icon: CheckCheck },
  {
    to: "/sms-settings",
    label: "SETTING",
    icon: Settings,
    children: [
      { to: "/sms-settings", label: "SMS Settings", icon: MessageSquare },
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
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
          isActive
            ? "bg-sidebar-accent text-white"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
        }`}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
          isActive
            ? "bg-sidebar-accent text-white"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
        }`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children.map((child) => {
            const childActive = currentPath === child.to;
            return (
              <Link
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  childActive
                    ? "text-white bg-sidebar-accent/70"
                    : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/30"
                }`}
              >
                <child.icon className="h-3.5 w-3.5 shrink-0" />
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
  "SETTING": "Setting",
  "BACKUP DATABASE": "Backup Database",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { addOrder } = useRepairs();
  const { signOut, user, isAdmin, permissions } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:relative ${
          collapsed ? "w-16" : "w-56"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
            <Wrench className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-white">
              RepairDesk
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto space-y-0.5 px-2 py-3 scrollbar-thin">
          {navItems.map((item) => (
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
          className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white transition-colors border-t border-sidebar-border"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>LOG OUT</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center border-t border-sidebar-border py-3 text-sidebar-foreground hover:text-white transition-colors"
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
          <div className="flex items-center gap-3">
            <AddRepairDialog onAdd={addOrder} />
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                A
              </div>
              <span className="text-xs font-medium text-primary-foreground">ADMIN</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
