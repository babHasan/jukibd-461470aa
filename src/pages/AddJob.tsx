import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [clients, setClients] = useState<{ id: string; client_name: string; company_name: string; contact_number?: string; address?: string }[]>([]);
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
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

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

  // Generate next sequential job number
  const generateNextJobNumber = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("job_number")
      .ilike("job_number", "JOB-%")
      .order("created_at", { ascending: false })
      .limit(100);
    
    let maxNum = 99;
    if (data) {
      for (const row of data) {
        const match = row.job_number.match(/^JOB-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    return `JOB-${maxNum + 1}`;
  };

  useEffect(() => {
    supabase.from("brands").select("id, name").order("name").then(({ data }) => data && setBrands(data));
    supabase.from("models").select("id, name").order("name").then(({ data }) => data && setModels(data));
    supabase.from("clients").select("id, client_name, company_name, contact_number, address").order("client_name").then(({ data }) => data && setClients(data));
    supabase.from("branches").select("id, name").eq("status", "active").order("name").then(({ data }) => {
      if (data) {
        setBranches(data);
        if (!selectedBranch && data.length > 0) {
          setSelectedBranch(data[0].id);
        }
      }
    });
    supabase.from("boards").select("id, name").order("name").then(({ data }) => data && setBoardsList(data));
  }, []);

  async function handleAddJob() {
    if (!brandName || !selectedModel) {
      toast.error("Please fill required fields (Brand, Model)");
      return;
    }
    const autoJobNumber = jobNumber || await generateNextJobNumber();
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
      jobNumber: autoJobNumber,
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
    // Validate challan number - same challan must belong to same customer
    if (factoryChallanNumber.trim()) {
      const { data: existingChallanJobs } = await supabase
        .from("jobs")
        .select("customer_id, customer_name")
        .eq("factory_challan_number", factoryChallanNumber.trim())
        .limit(1)
        .maybeSingle();

      if (existingChallanJobs) {
        const existingCustomerId = existingChallanJobs.customer_id;
        const currentCustomerId = selectedCustomer || null;
        if (existingCustomerId && currentCustomerId && existingCustomerId !== currentCustomerId) {
          toast.error(`Challan "${factoryChallanNumber}" already belongs to a different customer. Same challan number must have the same customer.`);
          return;
        }
        if (!currentCustomerId && existingCustomerId) {
          toast.error(`Challan "${factoryChallanNumber}" already belongs to a different customer. Same challan number must have the same customer.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Fetch user profile name
      let createdByName = "";
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        createdByName = profileData?.name || "";
      }
      let customerObj = clients.find((c) => c.id === selectedCustomer);
      const branchObj = branches.find((b) => b.id === selectedBranch);

      let customerId = selectedCustomer || null;
      const customerName = customerObj ? customerObj.client_name : manualCustomerName;
      const customerMobile = customerObj ? (customerObj.contact_number || "") : manualCustomerMobile;

      // Auto-create new client if manual entry (not selected from dropdown)
      // Check for duplicate company_name first to avoid duplicates
      if (!selectedCustomer && manualCustomerName) {
        let existingClient = null;
        if (manualCompanyName.trim()) {
          const { data: found } = await supabase
            .from("clients")
            .select("id")
            .ilike("company_name", manualCompanyName.trim())
            .limit(1)
            .maybeSingle();
          existingClient = found;
        }

        if (existingClient) {
          // Reuse existing client with matching company name
          customerId = existingClient.id;
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
              client_name: manualCustomerName,
              contact_number: manualCustomerMobile,
              company_name: manualCompanyName,
              address: manualAddress,
            })
            .select()
            .single();
          if (clientError) {
            console.error("Failed to create client:", clientError.message);
          } else if (newClient) {
            customerId = newClient.id;
          }
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
        created_by_name: createdByName,
      }));

      const { data: insertedJobs, error } = await supabase.from("jobs").insert(jobRows).select();
      if (error) {
        toast.error("Failed to submit: " + error.message);
      } else {
        toast.success(`${addedJobs.length} job(s) submitted successfully`);

        // Open print invoice in new tab
        if (insertedJobs?.length) {
          const challanNo = insertedJobs[0].factory_challan_number;
          const printUrl = challanNo
            ? `/print-invoice?challan=${encodeURIComponent(challanNo)}`
            : `/print-invoice?job=${insertedJobs[0].id}`;
          window.open(printUrl, "_blank");

          
        }

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
        sessionStorage.removeItem("addJob_manualCompany");
        sessionStorage.removeItem("addJob_manualAddress");
        sessionStorage.removeItem("addJob_challan");
        sessionStorage.removeItem("addJob_branch");
        sessionStorage.removeItem("addJob_date");
        setAddedJobs([]);
        setSelectedCustomer("");
        setManualCustomerName("");
        setManualCustomerMobile("");
        setManualCompanyName("");
        setManualAddress("");
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
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold">Job Number</Label>
                <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="Auto-generated if empty" className="h-8 text-sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold">
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

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold">
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

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold">
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

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start sm:items-center gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold">Board Serial Number</Label>
                <Input value={boardSerial} onChange={(e) => setBoardSerial(e.target.value)} className="h-8 text-sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold sm:pt-2">Details Of Problem</Label>
                <Textarea value={detailsOfProblem} onChange={(e) => setDetailsOfProblem(e.target.value)} className="text-sm min-h-[60px]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-1 sm:gap-2">
                <Label className="text-left sm:text-right text-xs font-semibold sm:pt-2">Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="text-sm min-h-[60px]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-1 sm:gap-2">
                <div className="hidden sm:block" />
                <Button onClick={handleAddJob} size="sm" className="w-full sm:w-fit bg-accent hover:bg-accent/90 text-accent-foreground">
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
              {/* Desktop table */}
              <div className="hidden sm:block overflow-auto max-h-[500px]">
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
              {/* Mobile card view */}
              <div className="sm:hidden space-y-2 p-2 max-h-[400px] overflow-auto">
                {addedJobs.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-8">No jobs added yet</p>
                ) : (
                  addedJobs.map((job, idx) => (
                    <div key={job.id} className="rounded-lg border bg-card p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold">{job.jobNumber}</span>
                        <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => handleRemoveJob(job.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p><span className="font-semibold">Brand:</span> {job.brand}</p>
                      <p><span className="font-semibold">Model:</span> {job.model}</p>
                      <p><span className="font-semibold">Board:</span> {job.board} {job.boardSerial && `(${job.boardSerial})`}</p>
                      {job.detailsOfProblem && <p className="text-muted-foreground line-clamp-2">{job.detailsOfProblem}</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Customer, Branch, Date, Challan */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Select Customer</Label>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={customerPopoverOpen} className="h-8 text-sm w-full justify-between font-normal">
                    {selectedCustomer
                      ? (() => {
                          const c = clients.find((cl) => cl.id === selectedCustomer);
                          return c ? (c.company_name ? `${c.company_name} (${c.client_name})` : c.client_name) : "Select Customer";
                        })()
                      : "Select or type below"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.company_name || ""} ${c.client_name} ${c.contact_number || ""}`}
                            onSelect={() => {
                              setSelectedCustomer(c.id);
                              setManualCustomerName(c.client_name);
                              setManualCustomerMobile(c.contact_number || "");
                              setManualCompanyName(c.company_name || "");
                              setManualAddress(c.address || "");
                              setCustomerPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCustomer === c.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="text-sm">{c.company_name ? `${c.company_name} (${c.client_name})` : c.client_name}</span>
                              {c.contact_number && <span className="text-xs text-muted-foreground">{c.contact_number}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Company Name</Label>
              <Input value={manualCompanyName} onChange={(e) => { setManualCompanyName(e.target.value); setSelectedCustomer(""); }} placeholder="Enter company name" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input value={manualCustomerName} onChange={(e) => { setManualCustomerName(e.target.value); setSelectedCustomer(""); }} placeholder="Enter client name" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Mobile Number</Label>
              <Input value={manualCustomerMobile} onChange={(e) => { setManualCustomerMobile(e.target.value); setSelectedCustomer(""); }} placeholder="Enter mobile number" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Address</Label>
              <Input value={manualAddress} onChange={(e) => { setManualAddress(e.target.value); setSelectedCustomer(""); }} placeholder="Enter address" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Factory Challan Number</Label>
              <Input value={factoryChallanNumber} onChange={(e) => setFactoryChallanNumber(e.target.value)} className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm w-40" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1 sm:gap-2 max-w-2xl">
              <Label className="text-left sm:text-right text-xs font-semibold">Challan Copy Upload</Label>
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
