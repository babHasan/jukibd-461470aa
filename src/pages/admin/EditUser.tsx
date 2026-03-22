import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { UserPhotoUpload } from "@/components/UserPhotoUpload";

const ALL_MODULES = [
  "Dashboard", "Branch", "Admin", "Machine Data", "Client Data",
  "Add Job", "Job List", "Collection", "Expense / Income",
  "Ledger", "Reports", "Cashbook", "Setting", "Backup Database", "Delivery",
];

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    employee_id: "",
    mobile: "",
    email: "",
    nid: "",
    address: "",
    status: "active",
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("user");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchUser(id);
  }, [id]);

  async function fetchUser(userId: string) {
    setLoading(true);
    const [profileRes, permsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_permissions").select("module").eq("user_id", userId),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    if (profileRes.error || !profileRes.data) {
      toast.error("User not found");
      navigate("/admin/users");
      return;
    }

    const p = profileRes.data;
    setForm({
      name: p.name || "",
      employee_id: p.employee_id || "",
      mobile: p.mobile || "",
      email: p.email || "",
      nid: p.nid || "",
      address: p.address || "",
      status: p.status || "active",
    });
    setPhotoUrl(p.photo_url || null);
    setSelectedModules((permsRes.data || []).map((r: any) => r.module));
    setCurrentRole((rolesRes.data || [])[0]?.role || "user");
    setLoading(false);
  }

  function toggleModule(mod: string) {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  }

  function selectAll() {
    setSelectedModules(
      selectedModules.length === ALL_MODULES.length ? [] : [...ALL_MODULES]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        employee_id: form.employee_id,
        mobile: form.mobile,
        nid: form.nid,
        address: form.address,
        status: form.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (profileError) {
      toast.error("Profile update failed: " + profileError.message);
      setSaving(false);
      return;
    }

    // Update role: delete existing, insert new
    await supabase.from("user_roles").delete().eq("user_id", id);
    await supabase.from("user_roles").insert({ user_id: id, role: currentRole as "admin" | "user" });

    // Update permissions: delete existing, insert new
    await supabase.from("user_permissions").delete().eq("user_id", id);
    if (selectedModules.length > 0) {
      await supabase.from("user_permissions").insert(
        selectedModules.map((mod) => ({ user_id: id, module: mod }))
      );
    }

    toast.success("User updated successfully!");
    setSaving(false);
    navigate("/admin/users");
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4" /> Back to User List
        </Button>

        <Card>
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle>EDIT USER — {form.name}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: form fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Id</Label>
                    <Input
                      value={form.employee_id}
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile (Log in ID)</Label>
                    <Input
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>NID</Label>
                    <Input
                      value={form.nid}
                      onChange={(e) => setForm({ ...form, nid: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={currentRole} onValueChange={setCurrentRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Right: module permissions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">Module Permissions</Label>
                    <Button type="button" size="sm" variant="outline" onClick={selectAll}>
                      {selectedModules.length === ALL_MODULES.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    {ALL_MODULES.map((mod) => (
                      <div key={mod} className="flex items-center justify-between">
                        <Label className="font-normal cursor-pointer" htmlFor={`mod-${mod}`}>
                          {mod}
                        </Label>
                        <Checkbox
                          id={`mod-${mod}`}
                          checked={selectedModules.includes(mod)}
                          onCheckedChange={() => toggleModule(mod)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "UPDATE USER"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/users")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
