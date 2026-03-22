import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Megaphone, Send, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SendResult {
  phone: string;
  name: string;
  status: string;
}

export default function BulkSms() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; sent: number; failed: number } | null>(null);

  useEffect(() => {
    fetchCustomerCount();
  }, []);

  async function fetchCustomerCount() {
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .neq("contact_number", "");
    setCustomerCount(count || 0);
  }

  async function handleSend() {
    if (!message.trim()) {
      toast.error("মেসেজ লিখুন");
      return;
    }
    if (customerCount === 0) {
      toast.error("কোনো কাস্টমার পাওয়া যায়নি");
      return;
    }

    const confirmed = window.confirm(
      `আপনি কি ${customerCount} জন কাস্টমারকে SMS পাঠাতে চান?\n\nমেসেজ:\n${message}`
    );
    if (!confirmed) return;

    setSending(true);
    setResults(null);
    setSummary(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("লগইন করুন");
        setSending(false);
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-bulk-sms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: message.trim() }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSummary({ total: data.total, sent: data.sent, failed: data.failed });
        setResults(data.results || []);
        toast.success(`${data.sent} জনকে SMS পাঠানো হয়েছে`);
        setMessage("");
      } else {
        toast.error(data.error || "SMS পাঠানো ব্যর্থ");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভার এরর");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            বাল্ক SMS / ঘোষণা
          </h2>
          <p className="text-muted-foreground mt-1">
            সব কাস্টমারকে একসাথে জরুরি বা ঘোষণা SMS পাঠান
          </p>
        </div>

        {/* Compose */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" />
              মেসেজ লিখুন
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-2">
              <Users className="h-3 w-3" />
              মোট কাস্টমার (ফোন নম্বরসহ): <Badge variant="secondary">{customerCount}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="এখানে আপনার ঘোষণা / জরুরি মেসেজ লিখুন..."
              rows={5}
              className="text-sm"
              dir="auto"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {message.length}/500 অক্ষর
              </span>
              <Button
                onClick={handleSend}
                disabled={sending || !message.trim() || customerCount === 0}
                className="min-w-[160px]"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    সবাইকে পাঠান ({customerCount})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">মোট</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-600">{summary.sent}</p>
                <p className="text-xs text-muted-foreground">সফল</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                <p className="text-xs text-muted-foreground">ব্যর্থ</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Table */}
        {results && results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">পাঠানোর ফলাফল</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>কাস্টমার</TableHead>
                      <TableHead>ফোন</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell className="text-sm">{r.name}</TableCell>
                        <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "sent" ? "default" : "destructive"} className="text-xs">
                            {r.status === "sent" ? "✓ পাঠানো" : "✗ ব্যর্থ"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-md p-3 text-sm">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.phone}</p>
                    </div>
                    <Badge variant={r.status === "sent" ? "default" : "destructive"} className="text-xs">
                      {r.status === "sent" ? "✓" : "✗"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
