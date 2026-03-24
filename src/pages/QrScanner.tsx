import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, Search, ScanLine } from "lucide-react";

export default function QrScanner() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"scan" | "generate">("scan");
  const [jobNumber, setJobNumber] = useState("");
  const [foundJob, setFoundJob] = useState<any>(null);
  const [qrValue, setQrValue] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (mode === "scan") {
      const scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10, qrbox: { width: 250, height: 250 },
      }, false);

      scanner.render(
        async (decodedText) => {
          scanner.clear();
          // Expect format: JUKIBD-{jobNumber} or just job number
          const jn = decodedText.replace("JUKIBD-", "").trim();
          const { data } = await supabase.from("jobs").select("*").eq("job_number", jn).maybeSingle();
          if (data) {
            toast.success(`Job ${jn} found!`);
            navigate(`/job/${data.id}`);
          } else {
            toast.error(`Job "${jn}" not found`);
          }
        },
        () => {}
      );
      scannerRef.current = scanner;

      return () => { scanner.clear().catch(() => {}); };
    }
  }, [mode, navigate]);

  const handleSearch = async () => {
    if (!jobNumber.trim()) return;
    const { data } = await supabase.from("jobs").select("*").eq("job_number", jobNumber.trim()).maybeSingle();
    if (data) {
      setFoundJob(data);
      setQrValue(`JUKIBD-${data.job_number}`);
    } else {
      toast.error("Job not found");
      setFoundJob(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><QrCode className="h-6 w-6" /> QR Code Scanner</h1>

        <div className="flex gap-2">
          <Button variant={mode === "scan" ? "default" : "outline"} onClick={() => setMode("scan")}>
            <ScanLine className="h-4 w-4 mr-1" /> Scan QR
          </Button>
          <Button variant={mode === "generate" ? "default" : "outline"} onClick={() => setMode("generate")}>
            <QrCode className="h-4 w-4 mr-1" /> Generate QR
          </Button>
        </div>

        {mode === "scan" ? (
          <Card>
            <CardHeader><CardTitle>Scan a Job QR Code</CardTitle></CardHeader>
            <CardContent>
              <div id="qr-reader" className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">Point your camera at a job QR code to look up the job instantly.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Generate Job QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter Job Number" value={jobNumber} onChange={e => setJobNumber(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
                <Button onClick={handleSearch}><Search className="h-4 w-4 mr-1" /> Find</Button>
              </div>

              {foundJob && (
                <div className="text-center space-y-3">
                  <div className="bg-white p-6 rounded-lg inline-block">
                    <QRCodeSVG value={qrValue} size={200} level="H" includeMargin />
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Job:</strong> {foundJob.job_number}</p>
                    <p><strong>Customer:</strong> {foundJob.customer_name}</p>
                    <p><strong>Brand:</strong> {foundJob.brand_name} {foundJob.model_name}</p>
                    <p><strong>Status:</strong> {foundJob.status}</p>
                  </div>
                  <Button variant="outline" onClick={() => {
                    const svg = document.querySelector(".bg-white svg");
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    canvas.width = 400; canvas.height = 400;
                    const ctx = canvas.getContext("2d")!;
                    const img = new Image();
                    img.onload = () => {
                      ctx.fillStyle = "white";
                      ctx.fillRect(0, 0, 400, 400);
                      ctx.drawImage(img, 0, 0, 400, 400);
                      const a = document.createElement("a");
                      a.download = `QR-${foundJob.job_number}.png`;
                      a.href = canvas.toDataURL("image/png");
                      a.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                  }}>Download QR Image</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
