import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, MessageSquare, Save, Loader2 } from "lucide-react";

interface SmsTemplate {
  id: string;
  trigger_status: string;
  template_text: string;
  is_active: boolean;
}

const triggerLabels: Record<string, string> = {
  received: "Job Received",
  diagnosing: "Diagnosing Started",
  "in-progress": "Work In Progress",
  completed: "Job Completed",
  "picked-up": "Job Picked Up / Delivered",
};

export default function NotificationSettings() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("sms_templates")
      .select("*")
      .order("trigger_status")
      .then(({ data }) => {
        if (data) setTemplates(data);
        setLoading(false);
      });
  }, []);

  async function toggleTemplate(id: string, isActive: boolean) {
    setSaving(true);
    const { error } = await supabase
      .from("sms_templates")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update notification setting");
    } else {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: isActive } : t))
      );
      toast.success(`Notification ${isActive ? "enabled" : "disabled"}`);
    }
    setSaving(false);
  }

  return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" />
            NOTIFICATION SETTINGS
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Enable or disable automatic SMS notifications sent to customers when job status changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No SMS templates configured. Go to SMS Settings to set up templates.
              </p>
            ) : (
              templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {triggerLabels[t.trigger_status] || t.trigger_status}
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md line-clamp-2">
                      {t.template_text}
                    </p>
                  </div>
                  <Switch
                    checked={t.is_active}
                    onCheckedChange={(checked) => toggleTemplate(t.id, checked)}
                    disabled={saving}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
