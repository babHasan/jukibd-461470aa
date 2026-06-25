import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageSquare, Save, History, Key, Settings } from "lucide-react";

interface SmsTemplate {
  id: string;
  trigger_status: string;
  template_text: string;
  is_active: boolean;
  updated_at: string;
}

interface SmsLog {
  id: string;
  repair_order_id: string;
  customer_phone: string;
  message_text: string;
  trigger_status: string;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  received: "📥 রিসিভ (Received)",
  completed: "✅ মেরামত সম্পন্ন (Completed)",
  "picked-up": "📦 ডেলিভারি (Picked Up)",
};

export default function SmsSettings() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  // SMS Config
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("");
  const [smsConfigId, setSmsConfigId] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
    fetchSmsConfig();
  }, []);

  async function fetchSmsConfig() {
    const { data } = await supabase.from("sms_config").select("*").limit(1).maybeSingle();
    if (data) {
      setSmsApiKey(data.api_key);
      setSmsSenderId(data.sender_id);
      setSmsConfigId(data.id);
    }
  }

  async function handleSaveConfig() {
    if (!smsApiKey.trim() || !smsSenderId.trim()) {
      toast.error("API Key এবং Sender ID দুটোই দিতে হবে");
      return;
    }
    setSavingConfig(true);
    const { error } = await supabase
      .from("sms_config")
      .update({ api_key: smsApiKey.trim(), sender_id: smsSenderId.trim(), updated_at: new Date().toISOString() })
      .eq("id", smsConfigId);
    if (error) {
      toast.error("সেভ ব্যর্থ: " + error.message);
    } else {
      toast.success("SMS কনফিগারেশন সেভ হয়েছে");
    }
    setSavingConfig(false);
  }

  async function fetchTemplates() {
    const { data, error } = await supabase
      .from("sms_templates")
      .select("*")
      .order("trigger_status");
    if (error) {
      toast.error("টেমপ্লেট লোড ব্যর্থ");
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }

  async function fetchLogs() {
    const { data } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs(data || []);
  }

  async function handleSave(id: string) {
    const { error } = await supabase
      .from("sms_templates")
      .update({ template_text: editText, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("সেভ ব্যর্থ হয়েছে");
    } else {
      toast.success("টেমপ্লেট সেভ হয়েছে");
      setEditingId(null);
      fetchTemplates();
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase
      .from("sms_templates")
      .update({ is_active: !current, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("আপডেট ব্যর্থ");
    } else {
      toast.success(!current ? "SMS চালু হয়েছে" : "SMS বন্ধ হয়েছে");
      fetchTemplates();
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            SMS নোটিফিকেশন সেটিংস
          </h2>
          <p className="text-muted-foreground mt-1">
            বাংলা SMS টেমপ্লেট ম্যানেজ করুন। প্লেসহোল্ডার: {`{{customer_name}}, {{device_brand}}, {{ticket_number}}, {{job_number}}, {{issue}}, {{estimated_cost}}`}
          </p>
        </div>

        {/* SMS API Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              SMS API কনফিগারেশন
            </CardTitle>
            <CardDescription className="text-xs">
              BulkSMSBD এর API Key এবং Sender ID সেট করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">API Key</Label>
                <Input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="আপনার BulkSMSBD API Key দিন"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sender ID</Label>
                <Input
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  placeholder="আপনার Sender ID দিন"
                />
              </div>
            </div>
            <Button onClick={handleSaveConfig} disabled={savingConfig} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {savingConfig ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </Button>
          </CardContent>
        </Card>

        {/* Templates */}
        <div className="grid gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {statusLabels[t.trigger_status] || t.trigger_status}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      স্ট্যাটাস: {t.trigger_status}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "চালু" : "বন্ধ"}
                    </Badge>
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={() => toggleActive(t.id, t.is_active)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === t.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                      dir="auto"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(t.id)}>
                        <Save className="h-4 w-4 mr-1" /> সেভ করুন
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        বাতিল
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer rounded-md border bg-muted/50 p-3 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      setEditingId(t.id);
                      setEditText(t.template_text);
                    }}
                    dir="auto"
                  >
                    {t.template_text}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SMS Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5" />
              SMS লগ (সর্বশেষ ৫০টি)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                কোনো SMS পাঠানো হয়নি
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>সময়</TableHead>
                    <TableHead>ফোন</TableHead>
                    <TableHead>স্ট্যাটাস ট্রিগার</TableHead>
                    <TableHead>ডেলিভারি</TableHead>
                    <TableHead>মেসেজ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.customer_phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.trigger_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                          {log.status === "sent" ? "✓ পাঠানো" : "✗ ব্যর্থ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs" dir="auto">
                        {log.message_text}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
