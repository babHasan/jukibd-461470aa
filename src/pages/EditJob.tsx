import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { syncJobsToMySQL } from "@/lib/sync-mysql";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function EditJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [boardsList, setBoardsList] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; client_name: string; company_name: string }[]>([]);

  const [jobNumber, setJobNumber] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [boardName, setBoardName] = useState("");
  const [boardSerial, setBoardSerial] = useState("");
  const [detailsOfProblem, setDetailsOfProblem] = useState("");
  const [remarks, setRemarks] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [factoryChallanNumber, setFactoryChallanNumber] = useState("");
  const [jobDate, setJobDate] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("brands").select("id, name").order("name"),
      supabase.from("models").select("id, name").order("name"),
      supabase.from("boards").select("id, name").order("name"),
      supabase.from("branches").select("id, name").eq("status", "active").order("name"),
      supabase.from("clients").select("id, client_name, company_name").order("client_name"),
    ]).then(([b, m, bo, br, cl]) => {
      setBrands(b.data || []);
      setModels(m.data || []);
      setBoardsList(bo.data || []);
      setBranches(br.data || []);
      setClients(cl.data || []);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase.from("jobs").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) {
        toast.error("Job not found");
        navigate("/");
        return;
      }
      setJobNumber(data.job_number);
      setBrandName(data.brand_name);
      setModelName(data.model_name);
      setBoardName(data.board_name);
      setBoardSerial(data.board_serial);
      setDetailsOfProblem(data.details_of_problem);
      setRemarks(data.remarks);
      setCustomerName(data.customer_name);
      setCustomerId(data.customer_id);
      setBranchId(data.branch_id);
      setBranchName(data.branch_name);
      setFactoryChallanNumber(data.factory_challan_number);
      setJobDate(data.job_date);
      setLoading(false);
    });
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);

    const selectedBranch = branches.find((b) => b.id === branchId);

    const { error } = await supabase.from("jobs").update({
      job_number: jobNumber,
      brand_name: brandName,
      model_name: modelName,
      board_name: boardName,
      board_serial: boardSerial,
      details_of_problem: detailsOfProblem,
      remarks,
      customer_name: customerName,
      customer_id: customerId,
      branch_id: branchId,
      branch_name: selectedBranch?.name || branchName,
      factory_challan_number: factoryChallanNumber,
      job_date: jobDate,
    }).eq("id", id);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Job updated successfully");
      syncJobsToMySQL([id]);
      navigate(`/job/${id}`);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/job/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Job — {jobNumber}</h1>
            <p className="text-sm text-muted-foreground">Update job details below</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Machine Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Machine Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Number</Label>
                  <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Job Date</Label>
                  <Input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select value={brands.find(b => b.name === brandName)?.id || ""} onValueChange={(v) => {
                    const found = brands.find(b => b.id === v);
                    if (found) setBrandName(found.name);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={models.find(m => m.name === modelName)?.id || ""} onValueChange={(v) => {
                    const found = models.find(m => m.id === v);
                    if (found) setModelName(found.name);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                    <SelectContent>
                      {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Board</Label>
                  <Select value={boardsList.find(b => b.name === boardName)?.id || ""} onValueChange={(v) => {
                    const found = boardsList.find(b => b.id === v);
                    if (found) setBoardName(found.name);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger>
                    <SelectContent>
                      {boardsList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Board Serial</Label>
                  <Input value={boardSerial} onChange={(e) => setBoardSerial(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Branch */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Customer & Branch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId || ""} onValueChange={(v) => {
                  setCustomerId(v);
                  const found = clients.find(c => c.id === v);
                  if (found) setCustomerName(found.client_name);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.client_name} {c.company_name ? `(${c.company_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer Name (Manual)</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branchId || ""} onValueChange={(v) => {
                  setBranchId(v);
                  const found = branches.find(b => b.id === v);
                  if (found) setBranchName(found.name);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Factory Challan Number</Label>
                <Input value={factoryChallanNumber} onChange={(e) => setFactoryChallanNumber(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problem & Remarks */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Problem & Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Details of Problem</Label>
              <Textarea value={detailsOfProblem} onChange={(e) => setDetailsOfProblem(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/job/${id}`)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
