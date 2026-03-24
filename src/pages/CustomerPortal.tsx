import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, Clock, CheckCircle, Loader2, Printer, PartyPopper, Star, MessageSquare, Phone, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  payable_amount?: number | null;
  receive_amount?: number | null;
  discount?: number | null;
  delivery_date?: string | null;
}

interface ClientInfo {
  id: string;
  client_name: string;
  contact_number: string;
  company_name: string;
}

function FeedbackForm({ jobId, jobNumber, customerName }: { jobId: string; jobNumber: string; customerName: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("customer_feedback").select("id").eq("job_id", jobId).limit(1).then(({ data }) => {
      if (data && data.length > 0) setSubmitted(true);
    });
  }, [jobId]);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("customer_feedback").insert({
      job_id: jobId, job_number: jobNumber, customer_name: customerName,
      rating, feedback_text: text,
    } as any);
    setSubmitting(false);
    if (error) { toast.error("Failed to submit feedback"); return; }
    toast.success("Thank you for your feedback!");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-md border bg-green-50 dark:bg-green-950/20 p-3 text-center">
        <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
        <p className="text-sm font-medium text-green-700 dark:text-green-400">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Rate your experience</p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(i)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`h-6 w-6 ${i <= (hovered || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Tell us about your experience (optional)..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <Button size="sm" onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}

function JobCard({ job, showFinancials = false }: { job: JobResult; showFinancials?: boolean }) {
  const currentIdx = jobStatusFlow.indexOf(job.status);

  return (
    <Card className="overflow-hidden">
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-1 pb-1">
          {jobStatusFlow.map((s, i) => {
            const isPast = i <= currentIdx;
            const isCurrent = i === currentIdx;
            const isPickedUp = job.status === "picked-up";
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <div className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium border ${
                  isPast ? statusColors[s] : "bg-muted/50 text-muted-foreground border-border"
                } ${isCurrent && !isPickedUp ? "animate-status-blink" : ""}`}>
                  {isPast && !isCurrent ? (
                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  ) : isCurrent ? (
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  ) : null}
                  <span className="hidden xs:inline">{jobStatusLabels[s]}</span>
                  <span className="xs:hidden">{jobStatusLabels[s].slice(0, 3)}</span>
                </div>
                {i < jobStatusFlow.length - 1 && (
                  <span className="text-muted-foreground/40 text-xs">→</span>
                )}
              </div>
            );
          })}
          {job.status === "picked-up" && (
            <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2 rounded-full bg-green-100 text-green-800 border border-green-300 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold">
              <PartyPopper className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Job Done
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
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
          {showFinancials && job.delivery_date && (
            <div>
              <p className="text-muted-foreground text-xs">Delivery Date</p>
              <p className="font-medium text-foreground">{job.delivery_date}</p>
            </div>
          )}
        </div>

        {job.details_of_problem && (
          <div className="text-sm">
            <p className="text-muted-foreground text-xs mb-1">Problem Details</p>
            <p className="text-foreground">{job.details_of_problem}</p>
          </div>
        )}

        {/* Bill Amount */}
        {(job.status === "completed" || job.status === "picked-up") && (
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-muted-foreground text-xs mb-1 font-semibold uppercase">Bill Amount</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {job.charge_type || "Normal"}
              </Badge>
              <span className="text-lg font-bold text-foreground">
                ৳{job.service_charge ?? 0}
              </span>
            </div>
            {showFinancials && (job.payable_amount != null || job.receive_amount != null) && (
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="text-center p-1.5 rounded bg-background">
                  <p className="text-muted-foreground">Payable</p>
                  <p className="font-bold">৳{job.payable_amount ?? 0}</p>
                </div>
                <div className="text-center p-1.5 rounded bg-background">
                  <p className="text-muted-foreground">Received</p>
                  <p className="font-bold text-green-600">৳{job.receive_amount ?? 0}</p>
                </div>
                <div className="text-center p-1.5 rounded bg-background">
                  <p className="text-muted-foreground">Due</p>
                  <p className="font-bold text-red-600">৳{(job.payable_amount ?? 0) - (job.receive_amount ?? 0)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Print Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(`/print-invoice?challan=${encodeURIComponent(job.factory_challan_number)}&type=customer-portal`, "_blank")}
          >
            <Printer className="h-3.5 w-3.5" />
            Print Receive Copy
          </Button>
          {(job.status === "completed" || job.status === "picked-up") && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => window.open(`/print-invoice?challan=${encodeURIComponent(job.factory_challan_number)}&type=customer-portal-delivery`, "_blank")}
            >
              <Printer className="h-3.5 w-3.5" />
              Print Delivery Copy
            </Button>
          )}
        </div>

        {/* Feedback Form - show for picked-up jobs */}
        {job.status === "picked-up" && (
          <FeedbackForm jobId={job.id} jobNumber={job.job_number} customerName={job.customer_name} />
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomerPortal() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollMessage, setScrollMessage] = useState("");
  const [scrollFontSize, setScrollFontSize] = useState(14);
  const [scrollFontColor, setScrollFontColor] = useState("#FFFFFF");

  // Job History state
  const [phone, setPhone] = useState("");
  const [historyJobs, setHistoryJobs] = useState<JobResult[]>([]);
  const [historyClient, setHistoryClient] = useState<ClientInfo | null>(null);
  const [historySearched, setHistorySearched] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("portal_scroll_messages")
      .select("message_text, font_size, font_color")
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setScrollMessage(data.message_text);
          setScrollFontSize(data.font_size ?? 14);
          setScrollFontColor(data.font_color ?? "#FFFFFF");
        }
      });
  }, []);

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

  async function handleHistorySearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 4) {
      toast.error("Please enter at least 4 digits of your phone number");
      return;
    }
    setHistoryLoading(true);
    setHistorySearched(true);
    const { data, error } = await supabase.functions.invoke("customer-lookup", {
      body: { phone: trimmed },
    });
    if (error || !data?.jobs) {
      setHistoryJobs([]);
      setHistoryClient(null);
    } else {
      setHistoryJobs(data.jobs);
      setHistoryClient(data.client || null);
    }
    setHistoryLoading(false);
  }

  // Summary stats for history
  const totalJobs = historyJobs.length;
  const activeJobs = historyJobs.filter(j => j.status !== "picked-up").length;
  const completedJobs = historyJobs.filter(j => j.status === "picked-up").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
            <Package className="h-5 w-5 sm:h-7 sm:w-7 text-accent" />
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Job Status Tracker</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Track your repair status or view your complete job history.
          </p>
        </div>
      </div>

      {/* Scroll Message */}
      {scrollMessage && (
        <div className="overflow-hidden bg-primary py-2">
          <div
            className="animate-marquee whitespace-nowrap font-medium"
            style={{ fontSize: `${scrollFontSize}px`, color: scrollFontColor }}
          >
            {scrollMessage} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {scrollMessage} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {scrollMessage}
          </div>
        </div>
      )}

      {/* Content with Tabs */}
      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="track" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="track" className="gap-1.5">
              <Search className="h-4 w-4" />
              Track Job
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              Job History
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Track Job (existing) */}
          <TabsContent value="track">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Enter Challan Number or Job Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="text-sm sm:text-base"
              />
              <Button type="submit" disabled={loading} className="gap-1.5 sm:gap-2 bg-accent text-accent-foreground hover:bg-accent/90 px-3 sm:px-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">Search</span>
              </Button>
            </form>

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
                  <p className="text-sm mt-1">Please check your Challan Number or Job Number and try again.</p>
                </div>
              )}
              {!loading && results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </TabsContent>

          {/* Tab 2: Job History */}
          <TabsContent value="history">
            <form onSubmit={handleHistorySearch} className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter your mobile number..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 text-sm sm:text-base"
                  type="tel"
                />
              </div>
              <Button type="submit" disabled={historyLoading} className="gap-1.5 sm:gap-2 bg-accent text-accent-foreground hover:bg-accent/90 px-3 sm:px-4">
                {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">Search</span>
              </Button>
            </form>

            <div className="mt-6 space-y-6">
              {historyLoading && (
                <div className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading history...
                </div>
              )}

              {!historyLoading && historySearched && historyJobs.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <Phone className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No job history found</p>
                  <p className="text-sm mt-1">Please check your mobile number and try again.</p>
                </div>
              )}

              {/* Client Info & Summary */}
              {!historyLoading && historyClient && historyJobs.length > 0 && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-bold text-foreground text-lg">{historyClient.client_name}</p>
                        {historyClient.company_name && (
                          <p className="text-sm text-muted-foreground">{historyClient.company_name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{historyClient.contact_number}</p>
                      </div>
                      <div className="flex gap-3 text-center">
                        <div className="px-3 py-1.5 rounded-lg bg-muted">
                          <p className="text-xl font-bold text-foreground">{totalJobs}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium">Total</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                          <p className="text-xl font-bold text-blue-600">{activeJobs}</p>
                          <p className="text-[10px] text-blue-600 uppercase font-medium">Active</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30">
                          <p className="text-xl font-bold text-green-600">{completedJobs}</p>
                          <p className="text-[10px] text-green-600 uppercase font-medium">Done</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job List */}
              {!historyLoading && historyJobs.map((job) => (
                <JobCard key={job.id} job={job} showFinancials />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
