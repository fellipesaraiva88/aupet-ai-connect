import React from "react";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface WhatsAppMessageProps {
  message: string;
  timestamp: string;
  isFromMe: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  senderName?: string;
  className?: string;
}

export function WhatsAppMessage({
  message,
  timestamp,
  isFromMe,
  isRead = false,
  isDelivered = true,
  senderName,
  className,
}: WhatsAppMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isFromMe ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 shadow-soft",
          isFromMe
            ? "bg-whatsapp text-white"
            : "bg-card border border-border"
        )}
      >
        {!isFromMe && senderName && (
          <p className="text-xs font-semibold text-primary mb-1">{senderName}</p>
        )}
        <p className="text-sm break-words">{message}</p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isFromMe ? "text-white/70" : "text-muted-foreground"
          )}
        >
          <span className="text-xs">{timestamp}</span>
          {isFromMe && (
            <div className="flex">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-300" />
              ) : isDelivered ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}