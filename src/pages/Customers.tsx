import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useRepairs } from "@/context/RepairContext";
import { AppLayout } from "@/components/AppLayout";
import { Phone, Mail, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface Customer {
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  orders: { id: string; ticketNumber: string; status: string; deviceBrand: string }[];
}

export default function Customers() {
  const { orders } = useRepairs();

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      const existing = map.get(o.customerName);
      if (existing) {
        existing.orderCount++;
        existing.totalSpent += o.estimatedCost;
        existing.orders.push({
          id: o.id,
          ticketNumber: o.ticketNumber,
          status: o.status,
          deviceBrand: o.deviceBrand,
        });
      } else {
        map.set(o.customerName, {
          name: o.customerName,
          phone: o.customerPhone,
          email: o.customerEmail,
          orderCount: 1,
          totalSpent: o.estimatedCost,
          orders: [
            {
              id: o.id,
              ticketNumber: o.ticketNumber,
              status: o.status,
              deviceBrand: o.deviceBrand,
            },
          ],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground">
            {customers.length} customers with {orders.length} total repairs
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.name}
              className="rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
                <div className="mt-1 space-y-0.5">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {customer.phone}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {customer.email}
                  </p>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Repairs: </span>
                  <span className="font-semibold text-foreground">{customer.orderCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold text-accent">${customer.totalSpent}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Wrench className="h-3 w-3" /> Repair History
                </p>
                <div className="space-y-1.5">
                  {customer.orders.map((o) => (
                    <Link
                      key={o.id}
                      to={`/repair/${o.id}`}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                    >
                      <span className="font-mono font-medium text-foreground">
                        {o.ticketNumber}
                      </span>
                      <StatusBadge status={o.status as any} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
