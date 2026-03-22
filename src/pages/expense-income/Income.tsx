import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function Income() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmAmount, setConfirmAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [remarks, setRemarks] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["income_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("income_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: incomes = [], isLoading } = useQuery({
    queryKey: ["incomes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setCategoryId("");
    setAmount("");
    setConfirmAmount("");
    setIncomeDate(format(new Date(), "yyyy-MM-dd"));
    setRemarks("");
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const cat = categories.find((c: any) => c.id === categoryId);
      const trNo = Date.now().toString();
      const { error } = await supabase.from("incomes").insert({
        category_id: categoryId,
        category_name: cat?.name || "",
        amount: parseFloat(amount),
        income_date: incomeDate,
        tr_no: trNo,
        remarks: remarks.trim(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Income added");
      resetForm();
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!categoryId) return toast.error("Select a category");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid amount");
    if (amount !== confirmAmount) return toast.error("Amounts do not match");
    addMutation.mutate();
  };

  const filtered = incomes.filter((inc: any) =>
    inc.category_name.toLowerCase().includes(search.toLowerCase()) ||
    inc.tr_no.includes(search)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-primary/10 py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-primary">MANAGE INCOME</CardTitle>
            <div className="flex items-center gap-3">
              <Input placeholder="Search..." className="w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={() => setShowAdd(true)} className="gap-1">
                <PlusCircle className="h-4 w-4" /> ADD NEW INCOME
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">SL No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tr No</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No income records found</TableCell></TableRow>
                ) : (
                  filtered.map((inc: any, i: number) => (
                    <TableRow key={inc.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{inc.income_date}</TableCell>
                      <TableCell className="text-xs">{inc.tr_no}</TableCell>
                      <TableCell>{inc.category_name}</TableCell>
                      <TableCell className="text-right font-medium">{Number(inc.amount).toFixed(2)}</TableCell>
                      <TableCell>{inc.remarks}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(inc.id)}>
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

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-primary">ADD INCOME</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Income Category Name <span className="text-destructive">*</span></Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select Income Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount <span className="text-destructive">*</span></Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Amount <span className="text-destructive">*</span></Label>
                <Input type="number" value={confirmAmount} onChange={(e) => setConfirmAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Income Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>SUBMIT</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
