import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Extract the storage path from a value that may be either a stored
 * public/signed URL (legacy data) or a bare path.
 */
export function extractAvatarPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const marker = "/avatars/";
  const idx = stored.indexOf(marker);
  if (idx >= 0) {
    const tail = stored.slice(idx + marker.length);
    // Strip any query string from a previously signed URL
    return tail.split("?")[0];
  }
  return stored;
}

export async function getAvatarSignedUrl(
  stored: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  const path = extractAvatarPath(stored);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** React hook that resolves a stored avatar reference to a fresh signed URL. */
export function useAvatarUrl(stored: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!stored) {
      setUrl(null);
      return;
    }
    getAvatarSignedUrl(stored).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [stored]);
  return url;
}