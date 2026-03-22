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

export default function Expenses() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmAmount, setConfirmAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [serviceProvider, setServiceProvider] = useState("");
  const [serviceProviderMemo, setServiceProviderMemo] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
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
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setServiceProvider("");
    setServiceProviderMemo("");
    setRemarks("");
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const cat = categories.find((c: any) => c.id === categoryId);
      const trNo = Date.now().toString();
      const { error } = await supabase.from("expenses").insert({
        category_id: categoryId,
        category_name: cat?.name || "",
        amount: parseFloat(amount),
        expense_date: expenseDate,
        service_provider: serviceProvider.trim(),
        service_provider_memo: serviceProviderMemo.trim(),
        memo_no: "",
        tr_no: trNo,
        remarks: remarks.trim(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense added");
      resetForm();
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!categoryId) return toast.error("Select a category");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid amount");
    if (amount !== confirmAmount) return toast.error("Amounts do not match");
    addMutation.mutate();
  };

  const filtered = expenses.filter((e: any) =>
    e.category_name.toLowerCase().includes(search.toLowerCase()) ||
    e.service_provider.toLowerCase().includes(search.toLowerCase()) ||
    e.tr_no.includes(search)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-primary/10 py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-primary">MANAGE EXPENSE</CardTitle>
            <div className="flex items-center gap-3">
              <Input placeholder="Search..." className="w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={() => setShowAdd(true)} className="gap-1">
                <PlusCircle className="h-4 w-4" /> ADD NEW EXPENSE
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
                  <TableHead>Memo No</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Provider Memo</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No expenses found</TableCell></TableRow>
                ) : (
                  filtered.map((exp: any, i: number) => (
                    <TableRow key={exp.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{exp.expense_date}</TableCell>
                      <TableCell className="text-xs">{exp.tr_no}</TableCell>
                      <TableCell>{exp.category_name}</TableCell>
                      <TableCell>{exp.memo_no}</TableCell>
                      <TableCell className="text-right font-medium">{Number(exp.amount).toFixed(2)}</TableCell>
                      <TableCell>{exp.service_provider}</TableCell>
                      <TableCell>{exp.service_provider_memo}</TableCell>
                      <TableCell>{exp.remarks}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(exp.id)}>
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">ADD EXPENSE</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label>Expense Category Name <span className="text-destructive">*</span></Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select Expense Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Service Provider (if it)</Label>
                <Input value={serviceProvider} onChange={(e) => setServiceProvider(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount <span className="text-destructive">*</span></Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Service Provider Memo (if it)</Label>
                <Input value={serviceProviderMemo} onChange={(e) => setServiceProviderMemo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Amount <span className="text-destructive">*</span></Label>
                <Input type="number" value={confirmAmount} onChange={(e) => setConfirmAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks (if it)</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Expense Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
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
