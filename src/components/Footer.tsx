import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const [content, setContent] = useState("");

  useEffect(() => {
    supabase
      .from("footer_content")
      .select("content")
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setContent(data.content);
      });
  }, []);

  if (!content) return null;

  return (
    <footer className="shrink-0 border-t bg-card px-4 py-3 text-center text-xs text-muted-foreground">
      {content}
    </footer>
  );
}
