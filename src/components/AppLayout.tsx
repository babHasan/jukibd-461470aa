import { Wrench, LayoutDashboard, Users, CalendarDays, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { AddRepairDialog } from "@/components/AddRepairDialog";
import { useRepairs } from "@/context/RepairContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/sms-settings", label: "SMS", icon: MessageSquare },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { addOrder } = useRepairs();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <Wrench className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-tight text-foreground">
                  RepairDesk
                </h1>
                <p className="text-xs text-muted-foreground">
                  Repair Management
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent/15 text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <AddRepairDialog onAdd={addOrder} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
