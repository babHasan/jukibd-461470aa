import { useState } from "react";
import {
  RepairOrder,
  RepairStatus,
  statusFlow,
  statusLabels,
} from "@/lib/repair-data";
import { StatusBadge } from "./StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RepairTableProps {
  orders: RepairOrder[];
  onUpdateStatus: (id: string, status: RepairStatus) => void;
}

export function RepairTable({ orders, onUpdateStatus }: RepairTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.deviceBrand.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function getNextStatus(current: RepairStatus): RepairStatus | null {
    const idx = statusFlow.indexOf(current);
    return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Repair Orders</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 sm:w-56"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusFlow.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Ticket</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Device</TableHead>
              <TableHead className="font-semibold">Issue</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Est. Cost</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No repair orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => {
                const next = getNextStatus(order.status);
                return (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-mono text-sm font-medium">
                      {order.ticketNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {order.customerPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.deviceBrand}</p>
                      <p className="text-xs text-muted-foreground">{order.deviceType}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {order.issue}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${order.estimatedCost}
                    </TableCell>
                    <TableCell className="text-right">
                      {next && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs text-accent hover:text-accent"
                          onClick={() => onUpdateStatus(order.id, next)}
                        >
                          {statusLabels[next]}
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
