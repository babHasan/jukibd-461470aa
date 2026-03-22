import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function IncomeCategory() {
  const [name, setName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["income_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_categories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("income_categories")
        .insert({ name: name.trim(), remarks: remarks.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Income category added");
      setName("");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["income_categories"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["income_categories"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = categories.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-primary/10 py-3 px-4">
            <CardTitle className="text-base font-semibold text-primary">ADD INCOME CATEGORY</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Income Category Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-2">
                <Label className="text-right pt-2">Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => addMutation.mutate()}
                  disabled={!name.trim() || addMutation.isPending}
                >
                  SUBMIT
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-primary/10 py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-primary">MANAGE INCOME CATEGORIES</CardTitle>
            <Input
              placeholder="Search..."
              className="w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">SL No</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No categories found</TableCell></TableRow>
                ) : (
                  filtered.map((cat: any, i: number) => (
                    <TableRow key={cat.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell>{cat.remarks}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(cat.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
