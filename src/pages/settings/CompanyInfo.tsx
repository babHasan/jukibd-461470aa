import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CompanyInfo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    address: "",
    email: "",
    website: "",
    phone: "",
    mobile: "",
    logo_url: "" as string | null,
    portal_enabled: true,
    header_font_size: 16,
  });

  useEffect(() => {
    supabase.from("company_info").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        setRowId(data.id);
        setForm({
          company_name: data.company_name || "",
          address: data.address || "",
          email: data.email || "",
          website: data.website || "",
          phone: data.phone || "",
          mobile: data.mobile || "",
          logo_url: data.logo_url || null,
          portal_enabled: (data as any).portal_enabled ?? true,
          header_font_size: (data as any).header_font_size ?? 16,
        });
      }
      setLoading(false);
    });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `company-logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload logo");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Logo uploaded");
  }

  async function handleSave() {
    if (!form.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);

    const payload = {
      company_name: form.company_name.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      phone: form.phone.trim(),
      mobile: form.mobile.trim(),
      logo_url: form.logo_url,
      portal_enabled: form.portal_enabled,
      updated_at: new Date().toISOString(),
    };

    const { error } = rowId
      ? await supabase.from("company_info").update(payload).eq("id", rowId)
      : await supabase.from("company_info").insert(payload);

    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Company info updated");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <Building className="h-5 w-5" />
            COMPANY INFO SETTING
          </h2>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">
                  Company Name<span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Enter company address"
                  rows={6}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Mobile<span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  placeholder="(+88) 01XXXXXXXXX"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Current Logo</Label>
                <div className="mt-1">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Company logo"
                      className="h-16 w-auto rounded border object-contain bg-white p-1"
                    />
                  ) : (
                    <span className="text-sm text-destructive font-medium">Logo Not Added</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Change Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-sm font-semibold">Client Portal</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable the public client portal (/track)</p>
                </div>
                <Switch
                  checked={form.portal_enabled}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, portal_enabled: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
              <Upload className="h-4 w-4" />
              {saving ? "Saving..." : "UPDATE"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
