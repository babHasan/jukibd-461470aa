import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Package, Clock, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const jobStatusLabels: Record<string, string> = {
  received: "Received",
  diagnosing: "Diagnosing",
  "in-progress": "In Progress",
  completed: "Completed",
  "picked-up": "Picked Up",
};

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 border-blue-200",
  diagnosing: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "in-progress": "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  "picked-up": "bg-muted text-muted-foreground border-border",
};

const jobStatusFlow = ["received", "diagnosing", "in-progress", "completed", "picked-up"];

interface JobResult {
  id: string;
  job_number: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  customer_name: string;
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
  created_at: string;
  service_charge: number | null;
  charge_type: string | null;
}

export default function CustomerPortal() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase.functions.invoke("customer-lookup", {
      body: { query: trimmed },
    });

    if (error || !data?.jobs) {
      setResults([]);
    } else {
      setResults(data.jobs);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="h-7 w-7 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Job Status Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Enter your Challan Number to check the current status of your repair.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter Challan Number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base"
          />
          <Button type="submit" disabled={loading} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </form>

        {/* Results */}
        <div className="mt-8 space-y-6">
          {loading && (
            <div className="text-center text-muted-foreground py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No jobs found</p>
              <p className="text-sm mt-1">Please check your Challan Number and try again.</p>
            </div>
          )}

          {!loading && results.map((job) => {
            const currentIdx = jobStatusFlow.indexOf(job.status);
            return (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">{job.job_number}</CardTitle>
                    <Badge className={statusColors[job.status] || ""}>
                      {jobStatusLabels[job.status] || job.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {job.brand_name} — {job.model_name}
                    {job.board_name ? ` — ${job.board_name}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Flow */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {jobStatusFlow.map((s, i) => {
                      const isPast = i <= currentIdx;
                      return (
                        <div key={s} className="flex items-center gap-1 shrink-0">
                          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                            isPast ? statusColors[s] : "bg-muted/50 text-muted-foreground border-border"
                          }`}>
                            {isPast && i === currentIdx ? (
                              <Clock className="h-3 w-3" />
                            ) : isPast ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : null}
                            {jobStatusLabels[s]}
                          </div>
                          {i < jobStatusFlow.length - 1 && (
                            <span className="text-muted-foreground/40">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Customer</p>
                      <p className="font-medium text-foreground">{job.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Branch</p>
                      <p className="font-medium text-foreground">{job.branch_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Challan No.</p>
                      <p className="font-medium text-foreground">{job.factory_challan_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Job Date</p>
                      <p className="font-medium text-foreground">{job.job_date}</p>
                    </div>
                    {job.board_serial && (
                      <div>
                        <p className="text-muted-foreground text-xs">Board Serial</p>
                        <p className="font-medium text-foreground">{job.board_serial}</p>
                      </div>
                    )}
                  </div>

                  {job.details_of_problem && (
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Problem Details</p>
                      <p className="text-foreground">{job.details_of_problem}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
