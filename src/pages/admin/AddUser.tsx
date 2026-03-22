import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { UserPhotoUpload } from "@/components/UserPhotoUpload";

const ALL_MODULES = [
  "Dashboard",
  "Branch",
  "Admin",
  "Machine Data",
  "Client Data",
  "Add Job",
  "Job List",
  "Collection",
  "Expense / Income",
  "Ledger",
  "Reports",
  "Cashbook",
  "Setting",
  "Backup Database",
  "Delivery",
];

export default function AddUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    employee_id: "",
    mobile: "",
    email: "",
    nid: "",
    address: "",
    password: "",
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

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
    if (!form.name || !form.password) {
      toast.error("Name and Password are required");
      return;
    }
    if (!form.email && !form.mobile) {
      toast.error("Email or Mobile is required");
      return;
    }

    setLoading(true);

    // If no email provided, generate one from mobile
    const email = form.email || `${form.mobile}@repairdesk.local`;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: { name: form.name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError || !authData.user) {
      toast.error(authError?.message || "Failed to create user");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Update profile with extra fields
    await supabase
      .from("profiles")
      .update({
        employee_id: form.employee_id,
        mobile: form.mobile,
        nid: form.nid,
        address: form.address,
      })
      .eq("id", userId);

    // Assign 'user' role
    await supabase.from("user_roles").insert({ user_id: userId, role: "user" });

    // Insert permissions
    if (selectedModules.length > 0) {
      await supabase.from("user_permissions").insert(
        selectedModules.map((mod) => ({ user_id: userId, module: mod }))
      );
    }

    toast.success("User created successfully!");
    setLoading(false);
    navigate("/admin/users");
  }

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <Card>
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle>ADD USER</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: form fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      User Name <span className="text-destructive">*</span>
                    </Label>
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
                    <Label>
                      Mobile (Log in ID) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Optional — auto-generated from mobile if empty</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Password <span className="text-destructive">*</span></Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                    />
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
                      placeholder="Address"
                      rows={3}
                    />
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
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? "Creating..." : "SAVE USER"}
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
