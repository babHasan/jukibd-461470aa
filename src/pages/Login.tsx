import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Look up email by mobile number using secure RPC
    const { data: email } = await supabase
      .rpc("lookup_email_by_mobile", { _mobile: mobile });

    if (!email) {
      toast.error("এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি");
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("পাসওয়ার্ড ভুল হয়েছে");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Wrench className="h-6 w-6 text-accent-foreground" />
          </div>
          <CardTitle className="text-xl">RepairDesk Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile (Log in ID)</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="01777704525"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "LOGIN"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
