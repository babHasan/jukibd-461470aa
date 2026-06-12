import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  label?: string;
  iconOnly?: boolean;
  className?: string;
}

// Normalize BD phone: strip non-digits, add 88 prefix for 01XXXXXXXXX
function toWaNumber(raw: string): string {
  let p = (raw || "").replace(/[^0-9]/g, "");
  if (!p) return "";
  if (p.startsWith("01") && p.length === 11) p = "88" + p;
  return p;
}

export function WhatsAppButton({
  phone,
  message = "",
  size = "sm",
  variant = "outline",
  label = "WhatsApp",
  iconOnly = false,
  className,
}: WhatsAppButtonProps) {
  const number = toWaNumber(phone);
  if (!number) return null;

  const url = `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={`gap-1.5 border-green-600/40 text-green-700 hover:bg-green-50 hover:text-green-800 dark:hover:bg-green-950/40 ${className || ""}`}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open WhatsApp chat">
        <MessageCircle className="h-3.5 w-3.5" />
        {!iconOnly && label}
      </a>
    </Button>
  );
}