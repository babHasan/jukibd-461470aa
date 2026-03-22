import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";

export default function FooterSettings() {
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [rowId, setRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("footer_content")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setRowId(data.id);
          setContent(data.content);
          setIsActive(data.is_active);
        }
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    const payload = { content, is_active: isActive, updated_at: new Date().toISOString() };

    let error;
    if (rowId) {
      ({ error } = await supabase.from("footer_content").update(payload).eq("id", rowId));
    } else {
      const res = await supabase.from("footer_content").insert(payload).select().single();
      error = res.error;
      if (res.data) setRowId(res.data.id);
    }

    if (error) {
      toast.error("Failed to save footer content");
    } else {
      toast.success("Footer content saved");
    }
    setSaving(false);
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Footer Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Footer Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Enter footer text..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="footer-active" />
              <Label htmlFor="footer-active">Show footer</Label>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" /> Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
              {content || "No content"}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
