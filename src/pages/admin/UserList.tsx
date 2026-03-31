import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, UserPlus, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

interface UserProfile {
  id: string;
  name: string;
  employee_id: string;
  mobile: string;
  email: string;
  nid: string;
  address: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export default function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetUser, setResetUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }

    const { data: allRoles } = await supabase.from("user_roles").select("*");
    const { data: allPerms } = await supabase.from("user_permissions").select("*");

    const mapped = (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      employee_id: p.employee_id,
      mobile: p.mobile,
      email: p.email,
      nid: p.nid,
      address: p.address,
      status: p.status,
      roles: (allRoles || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      permissions: (allPerms || []).filter((pe: any) => pe.user_id === p.id).map((pe: any) => pe.module),
    }));

    setUsers(mapped);
    setLoading(false);
  }

  async function handleResetPassword() {
    if (!resetUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResetting(true);
    const { data: { session } } = await supabase.auth.getSession();

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: resetUser.id,
          new_password: newPassword,
        }),
      }
    );

    const result = await res.json();
    setResetting(false);

    if (result.success) {
      toast.success(`${resetUser.name} এর পাসওয়ার্ড রিসেট হয়েছে`);
      setResetUser(null);
      setNewPassword("");
    } else {
      toast.error(result.error || "Reset failed");
    }
  }

  function handleExport() {
    const exportData = filtered.map((u, i) => ({
      SL: i + 1,
      Name: u.name,
      "Employee ID": u.employee_id,
      Mobile: u.mobile,
      Email: u.email,
      NID: u.nid,
      Address: u.address,
      Status: u.status,
      Roles: u.roles.join(", "),
      Permissions: u.permissions.join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "user_list.xlsx");
    toast.success("User list exported");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) {
          toast.error("No data found in file");
          return;
        }

        let importCount = 0;
        for (const row of rows) {
          const name = row["Name"] || row["name"] || "";
          const email = row["Email"] || row["email"] || "";
          const mobile = row["Mobile"] || row["mobile"] || "";
          const employee_id = row["Employee ID"] || row["employee_id"] || "";
          const nid = row["NID"] || row["nid"] || "";
          const address = row["Address"] || row["address"] || "";

          if (!name && !email) continue;

          // Check if profile already exists by email
          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (existing) continue;

          // Create auth user via edge function or skip if no email
          if (!email) continue;

          // Insert profile directly (for data import only)
          const { error } = await supabase.from("profiles").insert({
            id: crypto.randomUUID(),
            name,
            email,
            mobile,
            employee_id,
            nid,
            address,
            status: "active",
          });

          if (!error) importCount++;
        }

        toast.success(`${importCount} users imported`);
        fetchUsers();
      } catch {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search)
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-foreground">USER LIST</h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> EXPORT
            </Button>
            <label>
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" /> IMPORT
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
                </span>
              </Button>
            </label>
            <Link to="/admin/add-user">
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" /> ADD NEW USER
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{filtered.length} records</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">SL</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Name</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Employee Id</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Mobile</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Email</TableHead>
                <TableHead className="text-primary-foreground font-semibold">NID</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Address</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Status</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Role</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user, i) => (
                  <TableRow key={user.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.employee_id}</TableCell>
                    <TableCell className="font-mono text-sm">{user.mobile}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>{user.nid}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm">{user.address}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        {user.permissions.length > 0
                          ? user.permissions.map((p) => (
                              <span key={p} className="block text-muted-foreground">{p}</span>
                            ))
                          : <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={`/admin/edit-user/${user.id}`}>
                          <Button size="sm" variant="outline">EDIT</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-accent text-accent-foreground hover:bg-accent/80"
                          onClick={() => {
                            setResetUser(user);
                            setNewPassword("");
                          }}
                        >
                          RESET PASSWORD
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Mobile: <span className="font-mono">{resetUser?.mobile}</span>
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6}>
              {resetting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
