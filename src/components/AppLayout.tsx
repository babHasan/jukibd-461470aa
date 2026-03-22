import {
  Wrench,
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ReactNode, useState } from "react";
import { AddRepairDialog } from "@/components/AddRepairDialog";
import { useRepairs } from "@/context/RepairContext";

const navItems = [
  { to: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { to: "/admin", label: "ADMIN", icon: Shield, hasSubmenu: true },
  { to: "/branch", label: "BRANCH", icon: GitBranch, hasSubmenu: true },
  { to: "/machine-data", label: "MACHINE DATA", icon: Monitor, hasSubmenu: true },
  { to: "/customers", label: "CLIENT DATA", icon: UserCircle, hasSubmenu: true },
  { to: "/add-job", label: "ADD JOB", icon: PlusCircle },
  { to: "/job-list", label: "JOB LIST", icon: ClipboardList },
  { to: "/collection", label: "COLLECTION", icon: Diamond, hasSubmenu: true },
  { to: "/expense-income", label: "EXPENSE / INCOME", icon: DollarSign, hasSubmenu: true },
  { to: "/ledger", label: "LEDGER", icon: BookOpen, hasSubmenu: true },
  { to: "/reports", label: "REPORTS", icon: FileText, hasSubmenu: true },
  { to: "/cashbook", label: "CASHBOOK", icon: Wallet, hasSubmenu: true },
  { to: "/challan-verify", label: "CHALLAN VERIFY", icon: CheckCheck },
  { to: "/sms-settings", label: "SETTING", icon: Settings, hasSubmenu: true },
  { to: "/backup", label: "BACKUP DATABASE", icon: Database },
  { to: "/calendar", label: "SMS", icon: MessageSquare },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { addOrder } = useRepairs();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:relative ${
          collapsed ? "w-16" : "w-56"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand */}
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto space-y-0.5 px-2 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.hasSubmenu && (
                  <ChevronRight className="h-3 w-3 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center border-t border-sidebar-border py-3 text-sidebar-foreground hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">
              {navItems.find((n) => n.to === location.pathname)?.label || "RepairDesk"}
            </h1>
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
