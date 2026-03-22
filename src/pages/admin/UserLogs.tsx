import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarIcon, LogIn, LogOut, Wrench, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  ip_address: string;
  created_at: string;
}

export default function UserLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchLogs();
  }, [date]);

  async function fetchLogs() {
    setLoading(true);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("user_activity_logs")
      .select("*")
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load logs");
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-foreground">USER ACTIVITY LOG</h2>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {logs.length} records for {format(date, "dd MMMM yyyy")}
        </p>

        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">SL</TableHead>
                <TableHead className="text-primary-foreground font-semibold">User Name</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Action</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Details</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No activity logs for this date
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => (
                  <TableRow key={log.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{log.user_name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.action === "login" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {log.action === "login" ? (
                          <LogIn className="h-3 w-3" />
                        ) : (
                          <LogOut className="h-3 w-3" />
                        )}
                        {log.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), "hh:mm:ss a")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
