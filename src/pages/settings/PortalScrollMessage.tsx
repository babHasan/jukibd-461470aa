import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, MessageSquareText, Type, Palette } from "lucide-react";

export default function PortalScrollMessage() {
  const [message, setMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("portal_scroll_messages")
        .select("*")
        .limit(1)
        .single();
      if (data) {
        setRecordId(data.id);
        setMessage(data.message_text);
        setIsActive(data.is_active);
        setFontSize(data.font_size ?? 14);
        setFontColor(data.font_color ?? "#FFFFFF");
      }
      setLoading(false);
    }
    fetch();
  }, []);

  async function handleSave() {
    setSaving(true);
    const payload = {
      message_text: message,
      is_active: isActive,
      font_size: fontSize,
      font_color: fontColor,
      updated_at: new Date().toISOString(),
    };
    if (recordId) {
      const { error } = await supabase
        .from("portal_scroll_messages")
        .update(payload)
        .eq("id", recordId);
      if (error) toast.error("Failed to save");
      else toast.success("Scroll message updated");
    } else {
      const { data, error } = await supabase
        .from("portal_scroll_messages")
        .insert(payload)
        .select()
        .single();
      if (error) toast.error("Failed to save");
      else {
        setRecordId(data.id);
        toast.success("Scroll message created");
      }
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Portal Scroll Message</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="h-5 w-5" />
              Scrolling Message Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="msg">Message Text</Label>
              <Textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Enter scrolling message for customer portal..."
                className="mt-1"
              />
            </div>

            {/* Font Size */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Type className="h-4 w-4" />
                Font Size: {fontSize}px
              </Label>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(v[0])}
                min={10}
                max={32}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10px</span>
                <span>32px</span>
              </div>
            </div>

            {/* Font Color */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Palette className="h-4 w-4" />
                Font Color
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="w-32 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              <Label htmlFor="active">Show on Customer Portal</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        {message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden bg-primary py-2 rounded-md">
                <div
                  className="animate-marquee whitespace-nowrap font-medium"
                  style={{ fontSize: `${fontSize}px`, color: fontColor }}
                >
                  {message} &nbsp;&nbsp;&nbsp; {message}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
