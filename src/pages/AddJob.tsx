import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface JobItem {
  id: string;
  service: string;
  brand: string;
  model: string;
  board: string;
  machineSerial: string;
  boardSerial: string;
  detailsOfProblem: string;
  remarks: string;
  jobNumber: string;
}

const AddJob = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; client_name: string; company_name: string; contact_number?: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [boardsList, setBoardsList] = useState<{ id: string; name: string }[]>([]);

  // Job form - persist selections in sessionStorage
  const [jobNumber, setJobNumber] = useState("");
  const [brandName, setBrandName] = useState(() => sessionStorage.getItem("addJob_brand") || "");
  const [selectedModel, setSelectedModel] = useState(() => sessionStorage.getItem("addJob_model") || "");
  const [board, setBoard] = useState(() => sessionStorage.getItem("addJob_board") || "");
  const [boardSerial, setBoardSerial] = useState("");
  const [detailsOfProblem, setDetailsOfProblem] = useState("");
  const [remarks, setRemarks] = useState("");

  // Added jobs list - persist in sessionStorage
  const [addedJobs, setAddedJobs] = useState<JobItem[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("addJob_jobs") || "[]"); } catch { return []; }
  });

  // Bottom form - persist in sessionStorage
  const [selectedCustomer, setSelectedCustomer] = useState(() => sessionStorage.getItem("addJob_customer") || "");
  const [manualCustomerName, setManualCustomerName] = useState(() => sessionStorage.getItem("addJob_manualName") || "");
  const [manualCustomerMobile, setManualCustomerMobile] = useState(() => sessionStorage.getItem("addJob_manualMobile") || "");
  const [manualCompanyName, setManualCompanyName] = useState(() => sessionStorage.getItem("addJob_manualCompany") || "");
  const [manualAddress, setManualAddress] = useState(() => sessionStorage.getItem("addJob_manualAddress") || "");
  const [factoryChallanNumber, setFactoryChallanNumber] = useState(() => sessionStorage.getItem("addJob_challan") || "");
  const [selectedBranch, setSelectedBranch] = useState(() => sessionStorage.getItem("addJob_branch") || "");
  const [date, setDate] = useState(() => sessionStorage.getItem("addJob_date") || new Date().toISOString().split("T")[0]);
  const [challanFile, setChallanFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync to sessionStorage
  useEffect(() => { sessionStorage.setItem("addJob_brand", brandName); }, [brandName]);
  useEffect(() => { sessionStorage.setItem("addJob_model", selectedModel); }, [selectedModel]);
  useEffect(() => { sessionStorage.setItem("addJob_board", board); }, [board]);
  useEffect(() => { sessionStorage.setItem("addJob_jobs", JSON.stringify(addedJobs)); }, [addedJobs]);
  useEffect(() => { sessionStorage.setItem("addJob_customer", selectedCustomer); }, [selectedCustomer]);
  useEffect(() => { sessionStorage.setItem("addJob_manualName", manualCustomerName); }, [manualCustomerName]);
  useEffect(() => { sessionStorage.setItem("addJob_manualMobile", manualCustomerMobile); }, [manualCustomerMobile]);
  useEffect(() => { sessionStorage.setItem("addJob_manualCompany", manualCompanyName); }, [manualCompanyName]);
  useEffect(() => { sessionStorage.setItem("addJob_manualAddress", manualAddress); }, [manualAddress]);
  useEffect(() => { sessionStorage.setItem("addJob_challan", factoryChallanNumber); }, [factoryChallanNumber]);
  useEffect(() => { sessionStorage.setItem("addJob_branch", selectedBranch); }, [selectedBranch]);
  useEffect(() => { sessionStorage.setItem("addJob_date", date); }, [date]);

  useEffect(() => {
    supabase.from("brands").select("id, name").order("name").then(({ data }) => data && setBrands(data));
    supabase.from("models").select("id, name").order("name").then(({ data }) => data && setModels(data));
    supabase.from("clients").select("id, client_name, company_name, contact_number").order("client_name").then(({ data }) => data && setClients(data));
    supabase.from("branches").select("id, name").eq("status", "active").order("name").then(({ data }) => {
      if (data) {
        setBranches(data);
        // Auto-select first branch if none selected
        if (!selectedBranch && data.length > 0) {
          setSelectedBranch(data[0].id);
        }
      }
    });
    supabase.from("boards").select("id, name").order("name").then(({ data }) => data && setBoardsList(data));
  }, []);

  function handleAddJob() {
    if (!brandName || !selectedModel) {
      toast.error("Please fill required fields (Brand, Model)");
      return;
    }
    const newJob: JobItem = {
      id: crypto.randomUUID(),
      service: "",
      brand: brands.find((b) => b.id === brandName)?.name || brandName,
      model: models.find((m) => m.id === selectedModel)?.name || selectedModel,
      board: boardsList.find((b) => b.id === board)?.name || board,
      machineSerial: "",
      boardSerial,
      detailsOfProblem,
      remarks,
      jobNumber: jobNumber || `JOB-${Date.now().toString(36).toUpperCase()}`,
    };
    setAddedJobs((prev) => [...prev, newJob]);
    // Only reset per-job unique fields, keep brand/model/board selection
    setJobNumber("");
    setBoardSerial("");
    setDetailsOfProblem("");
    setRemarks("");
    toast.success("Job added to list");
  }

  function handleRemoveJob(id: string) {
    setAddedJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function handleSubmit() {
    if (addedJobs.length === 0) {
      toast.error("Please add at least one job");
      return;
    }
    const hasCustomer = selectedCustomer || manualCustomerName;
    if (!hasCustomer) {
      toast.error("Please select or enter a Customer");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let customerObj = clients.find((c) => c.id === selectedCustomer);
      const branchObj = branches.find((b) => b.id === selectedBranch);

      let customerId = selectedCustomer || null;
      const customerName = customerObj ? customerObj.client_name : manualCustomerName;
      const customerMobile = customerObj ? (customerObj.contact_number || "") : manualCustomerMobile;

      // Auto-create new client if manual entry (not selected from dropdown)
      if (!selectedCustomer && manualCustomerName) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            client_name: manualCustomerName,
            contact_number: manualCustomerMobile,
          })
          .select()
          .single();
        if (clientError) {
          console.error("Failed to create client:", clientError.message);
        } else if (newClient) {
          customerId = newClient.id;
        }
      }

      const jobRows = addedJobs.map((job) => ({
        job_number: job.jobNumber,
        brand_name: job.brand,
        model_name: job.model,
        board_name: job.board,
        board_serial: job.boardSerial,
        details_of_problem: job.detailsOfProblem,
        remarks: job.remarks,
        customer_id: customerId,
        customer_name: customerName,
        branch_id: selectedBranch || null,
        branch_name: branchObj ? branchObj.name : "",
        factory_challan_number: factoryChallanNumber,
        job_date: date,
        status: "received",
        created_by: user?.id,
      }));

      const { data: insertedJobs, error } = await supabase.from("jobs").insert(jobRows).select();
      if (error) {
        toast.error("Failed to submit: " + error.message);
      } else {
        toast.success(`${addedJobs.length} job(s) submitted successfully`);

        // Send SMS for each job (trigger_status = "received")
        if (customerMobile) {
          for (const job of insertedJobs || []) {
            try {
              await supabase.functions.invoke("send-sms", {
                body: {
                  repair_order_id: job.id,
                  customer_phone: customerMobile,
                  customer_name: job.customer_name,
                  device_brand: job.brand_name,
                  ticket_number: job.job_number,
                  issue: job.details_of_problem,
                  estimated_cost: 0,
                  trigger_status: "received",
                },
              });
            } catch (smsErr) {
              console.error("SMS send failed for job:", job.job_number, smsErr);
            }
          }
        }

        // Clear all persisted state
        sessionStorage.removeItem("addJob_brand");
        sessionStorage.removeItem("addJob_model");
        sessionStorage.removeItem("addJob_board");
        sessionStorage.removeItem("addJob_jobs");
        sessionStorage.removeItem("addJob_customer");
        sessionStorage.removeItem("addJob_manualName");
        sessionStorage.removeItem("addJob_manualMobile");
        sessionStorage.removeItem("addJob_challan");
        sessionStorage.removeItem("addJob_branch");
        sessionStorage.removeItem("addJob_date");
        setAddedJobs([]);
        setSelectedCustomer("");
        setManualCustomerName("");
        setManualCustomerMobile("");
        setFactoryChallanNumber("");
        setSelectedBranch("");
        setBrandName("");
        setSelectedModel("");
        setBoard("");
        setChallanFile(null);
        navigate("/job-list");
      }
    } catch (err: any) {
      toast.error("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Top Section: Job Form + Added Jobs Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Job Form */}
          <Card>
            <CardHeader className="bg-primary py-2 px-4 rounded-t-lg">
              <CardTitle className="text-sm font-bold text-primary-foreground uppercase">Job</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right text-xs font-semibold">Job Number</Label>
                <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="Auto-generated if empty" className="h-8 text-sm" />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right text-xs font-semibold">
                  Brand Name <span className="text-destructive">*</span>
                </Label>
                <Select value={brandName} onValueChange={setBrandName}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right text-xs font-semibold">
                  Select Model <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Model" /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right text-xs font-semibold">
                  Select Board <span className="text-destructive">*</span>
                </Label>
                <Select value={board} onValueChange={setBoard}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Board" /></SelectTrigger>
                  <SelectContent>
                    {boardsList.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right text-xs font-semibold">Board Serial Number</Label>
                <Input value={boardSerial} onChange={(e) => setBoardSerial(e.target.value)} className="h-8 text-sm" />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-2">
                <Label className="text-right text-xs font-semibold pt-2">Details Of Problem</Label>
                <Textarea value={detailsOfProblem} onChange={(e) => setDetailsOfProblem(e.target.value)} className="text-sm min-h-[60px]" />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-2">
                <Label className="text-right text-xs font-semibold pt-2">Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="text-sm min-h-[60px]" />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <div />
                <Button onClick={handleAddJob} size="sm" className="w-fit bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="h-3 w-3 mr-1" /> ADD
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Added Jobs Table */}
          <Card>
            <CardHeader className="bg-primary py-2 px-4 rounded-t-lg">
              <CardTitle className="text-sm font-bold text-primary-foreground uppercase">Added Job</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">SL</TableHead>
                      
                      <TableHead className="text-xs font-bold">BRAND</TableHead>
                      <TableHead className="text-xs font-bold">MODEL</TableHead>
                      <TableHead className="text-xs font-bold">BOARD</TableHead>
                      
                      <TableHead className="text-xs font-bold">BOARD SERIAL</TableHead>
                      <TableHead className="text-xs font-bold">DETAILS OF PROBLEM</TableHead>
                      <TableHead className="text-xs font-bold">REMARKS</TableHead>
                      <TableHead className="text-xs font-bold">JOB NUMBER</TableHead>
                      <TableHead className="text-xs font-bold">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addedJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground text-xs py-8">
                          No jobs added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      addedJobs.map((job, idx) => (
                        <TableRow key={job.id}>
                          <TableCell className="text-xs">{idx + 1}</TableCell>
                          
                          <TableCell className="text-xs">{job.brand}</TableCell>
                          <TableCell className="text-xs">{job.model}</TableCell>
                          <TableCell className="text-xs">{job.board}</TableCell>
                          
                          <TableCell className="text-xs">{job.boardSerial}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{job.detailsOfProblem}</TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate">{job.remarks}</TableCell>
                          <TableCell className="text-xs">{job.jobNumber}</TableCell>
                          <TableCell>
                            <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => handleRemoveJob(job.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Customer, Branch, Date, Challan */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">Select Customer</Label>
              <Select value={selectedCustomer} onValueChange={(val) => {
                setSelectedCustomer(val);
                const c = clients.find((cl) => cl.id === val);
                if (c) {
                  setManualCustomerName(c.client_name);
                  setManualCustomerMobile(c.contact_number || "");
                }
              }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select or type below" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_name}{c.company_name ? ` (${c.company_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input value={manualCustomerName} onChange={(e) => { setManualCustomerName(e.target.value); setSelectedCustomer(""); }} placeholder="Enter customer name" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">Mobile Number</Label>
              <Input value={manualCustomerMobile} onChange={(e) => { setManualCustomerMobile(e.target.value); setSelectedCustomer(""); }} placeholder="Enter mobile number" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">Factory Challan Number</Label>
              <Input value={factoryChallanNumber} onChange={(e) => setFactoryChallanNumber(e.target.value)} className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm w-40" />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-2 max-w-2xl">
              <Label className="text-right text-xs font-semibold">Challan Copy Upload</Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setChallanFile(e.target.files?.[0] || null)} className="h-8 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-5">
          {submitting ? "SUBMITTING..." : "SUBMIT"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default AddJob;
