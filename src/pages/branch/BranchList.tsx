import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { PlusCircle, Edit, Trash2, Building } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
}

export default function BranchList() {
  const { isAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBranches() {
    setLoading(true);
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load branches");
    } else {
      setBranches(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete branch");
    } else {
      toast.success("Branch deleted");
      setBranches((prev) => prev.filter((b) => b.id !== id));
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Branch List</h2>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link to="/branch/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Branch
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No branches found.</p>
            {isAdmin && (
              <Button asChild className="mt-4" variant="outline">
                <Link to="/branch/add">Add your first branch</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch, idx) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-semibold">{branch.name}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.address || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={branch.status === "active" ? "default" : "secondary"}>
                        {branch.status}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/branch/edit/${branch.id}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{branch.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(branch.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
