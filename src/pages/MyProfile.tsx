import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPhotoUpload } from "@/components/UserPhotoUpload";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function MyProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", mobile: "", email: "" });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("name, mobile, email, photo_url")
      .eq("id", user!.id)
      .single();

    if (data) {
      setForm({ name: data.name, mobile: data.mobile, email: data.email });
      setPhotoUrl(data.photo_url);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq("id", user!.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile photo updated!");
    }
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
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle>MY PROFILE</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex justify-center">
                <UserPhotoUpload
                  photoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                  userId={user!.id}
                  userFolder
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input value={form.mobile} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} disabled className="bg-muted" />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "SAVE PHOTO"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
