import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Palette, Type, Table2, Save } from "lucide-react";

interface ThemeForm {
  id: string;
  primary_color: string;
  sidebar_bg_color: string;
  page_bg_color: string;
  menu_font_size: number;
  menu_font_color: string;
  submenu_font_size: number;
  submenu_font_color: string;
  table_font_size: number;
  table_font_color: string;
  table_header_bg_color: string;
  table_header_font_color: string;
}

const defaults: Omit<ThemeForm, "id"> = {
  primary_color: "#1e3a5f",
  sidebar_bg_color: "#0f1c2e",
  page_bg_color: "#f4f6f8",
  menu_font_size: 13,
  menu_font_color: "#94a3b8",
  submenu_font_size: 12,
  submenu_font_color: "#94a3b8",
  table_font_size: 14,
  table_font_color: "#1e293b",
  table_header_bg_color: "#f1f5f9",
  table_header_font_color: "#334155",
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-40 text-sm shrink-0">{label}</Label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-28 font-mono text-xs" />
    </div>
  );
}

function SizeField({ label, value, onChange, min = 10, max = 24 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-40 text-sm shrink-0">{label}</Label>
      <Slider min={min} max={max} step={1} value={[value]} onValueChange={([v]) => onChange(v)} className="flex-1" />
      <span className="w-12 text-sm font-mono text-right">{value}px</span>
    </div>
  );
}

export default function AppearanceSettings() {
  const [form, setForm] = useState<ThemeForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("theme_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setForm(data as unknown as ThemeForm);
    });
  }, []);

  const update = (field: keyof Omit<ThemeForm, "id">, value: string | number) => {
    if (form) setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const { id, ...rest } = form;
    const { error } = await supabase.from("theme_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Appearance settings saved! Reload the page to apply.");
    }
  };

  if (!form) return <AppLayout><div className="p-8 text-muted-foreground">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Palette className="h-6 w-6" /> Appearance Settings</h1>

        {/* Theme Colors */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Theme Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ColorField label="Primary Color" value={form.primary_color} onChange={(v) => update("primary_color", v)} />
            <ColorField label="Sidebar Background" value={form.sidebar_bg_color} onChange={(v) => update("sidebar_bg_color", v)} />
            <ColorField label="Page Background" value={form.page_bg_color} onChange={(v) => update("page_bg_color", v)} />
          </CardContent>
        </Card>

        {/* Menu Fonts */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Menu & Submenu Fonts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SizeField label="Menu Font Size" value={form.menu_font_size} onChange={(v) => update("menu_font_size", v)} />
            <ColorField label="Menu Font Color" value={form.menu_font_color} onChange={(v) => update("menu_font_color", v)} />
            <SizeField label="Submenu Font Size" value={form.submenu_font_size} onChange={(v) => update("submenu_font_size", v)} />
            <ColorField label="Submenu Font Color" value={form.submenu_font_color} onChange={(v) => update("submenu_font_color", v)} />

            {/* Preview */}
            <div className="rounded-lg p-4 mt-2" style={{ backgroundColor: form.sidebar_bg_color }}>
              <p className="font-medium" style={{ fontSize: form.menu_font_size, color: form.menu_font_color }}>📁 MENU ITEM PREVIEW</p>
              <div className="ml-6 mt-1 border-l pl-3" style={{ borderColor: form.menu_font_color + "40" }}>
                <p style={{ fontSize: form.submenu_font_size, color: form.submenu_font_color }}>📄 Submenu Item Preview</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Fonts */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Table2 className="h-5 w-5" /> Table Fonts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SizeField label="Table Font Size" value={form.table_font_size} onChange={(v) => update("table_font_size", v)} />
            <ColorField label="Table Font Color" value={form.table_font_color} onChange={(v) => update("table_font_color", v)} />
            <ColorField label="Table Header BG" value={form.table_header_bg_color} onChange={(v) => update("table_header_bg_color", v)} />
            <ColorField label="Header Font Color" value={form.table_header_font_color} onChange={(v) => update("table_header_font_color", v)} />

            {/* Preview */}
            <div className="rounded-lg border overflow-hidden mt-2">
              <div className="flex" style={{ backgroundColor: form.table_header_bg_color, color: form.table_header_font_color, fontSize: form.table_font_size }}>
                <div className="flex-1 p-2 font-semibold border-r">Column A</div>
                <div className="flex-1 p-2 font-semibold border-r">Column B</div>
                <div className="flex-1 p-2 font-semibold">Column C</div>
              </div>
              <div className="flex" style={{ color: form.table_font_color, fontSize: form.table_font_size }}>
                <div className="flex-1 p-2 border-r border-t">Data 1</div>
                <div className="flex-1 p-2 border-r border-t">Data 2</div>
                <div className="flex-1 p-2 border-t">Data 3</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Appearance Settings"}
        </Button>
      </div>
    </AppLayout>
  );
}
