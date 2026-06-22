import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAvatarUrl } from "@/lib/avatarUrl";

interface UserPhotoUploadProps {
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  userId?: string;
  /** If true, uploads to a user-owned folder so RLS allows non-admins */
  userFolder?: boolean;
}

export function UserPhotoUpload({ photoUrl, onPhotoChange, userId, userFolder }: UserPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = useAvatarUrl(photoUrl);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const id = userId || crypto.randomUUID();
    const fileName = userFolder ? `${id}/avatar.${ext}` : `${id}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    // Store the storage path; signed URLs are generated on display.
    onPhotoChange(fileName);
    setUploading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-28 w-28 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center overflow-hidden">
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="User" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="absolute top-0 right-0 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...</>
        ) : (
          "Upload Photo"
        )}
      </Button>
    </div>
  );
}
