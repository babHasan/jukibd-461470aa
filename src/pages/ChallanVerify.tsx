import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, CheckCheck, ExternalLink } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ChallanJob {
  id: string;
  factory_challan_number: string;
  job_date: string;
  customer_name: string;
  status: string;
  challan_url: string | null;
  cheque_url: string | null;
}

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  diagnosing: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  "picked-up": "bg-gray-100 text-gray-800",
};

export default function ChallanVerify() {
  const [challanNumber, setChallanNumber] = useState("");
  const [results, setResults] = useState<ChallanJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!challanNumber.trim()) {
      toast.error("Please enter a Challan Number");
      return;
    }
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("jobs")
      .select("id, factory_challan_number, job_date, customer_name, status, challan_url, cheque_url")
      .eq("factory_challan_number", challanNumber.trim())
      .order("job_date", { ascending: false });

    if (error) {
      toast.error("Failed to search");
    }
    setResults(data || []);
    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">Challan Number</span>
          <Input
            placeholder="Enter Challan Number"
            value={challanNumber}
            onChange={(e) => setChallanNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-72"
          />
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            <Search className="h-4 w-4" />
            SEARCH
          </Button>
        </div>

        {/* Results */}
        <div className="rounded-lg border bg-card overflow-auto">
          <div className="bg-primary px-4 py-2">
            <h3 className="text-sm font-bold text-primary-foreground flex items-center gap-2">
              <CheckCheck className="h-4 w-4" />
              Challan List
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Challan No</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Challan Copy</TableHead>
                <TableHead className="font-semibold">Check Copy</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Searching...</TableCell></TableRow>
              ) : !searched ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Enter a challan number to search</TableCell></TableRow>
              ) : results.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-destructive py-8">No Challan Found</TableCell></TableRow>
              ) : (
                results.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="text-sm font-mono font-medium">{job.factory_challan_number}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{job.job_date}</TableCell>
                    <TableCell className="text-sm">{job.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${statusColors[job.status] || ""}`}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.challan_url ? (
                        <a href={job.challan_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {job.cheque_url ? (
                        <a href={job.cheque_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                        <a href={`/job/${job.id}`}>Details</a>
                      </Button>
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
