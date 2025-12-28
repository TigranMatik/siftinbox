"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { EmailConnection } from "@/types/database";

interface EmailConnectionCardProps {
  connection: EmailConnection;
}

export function EmailConnectionCard({ connection }: EmailConnectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this email account?")) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("email_connections")
        .delete()
        .eq("id", connection.id);

      if (error) throw error;

      toast.success("Email account disconnected");
      router.refresh();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/emails/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });

      if (!response.ok) throw new Error("Sync failed");

      toast.success("Email scan started");
      router.refresh();
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Failed to start email scan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF3D5] border border-[#C4A484]/30">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#C4A484] flex items-center justify-center">
          <Mail className="w-6 h-6 text-[#FFF3D5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[#5C4A32]">{connection.email_address}</h3>
            <Badge
              className={
                connection.is_active
                  ? "bg-green-100 text-green-700 border-none"
                  : "bg-red-100 text-red-700 border-none"
              }
            >
              {connection.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-[#8B7355]">
            {connection.provider.charAt(0).toUpperCase() + connection.provider.slice(1)}
            {connection.last_sync_at && (
              <> · Last synced {format(new Date(connection.last_sync_at), "MMM d, h:mm a")}</>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8B7355] hover:bg-[#F5E6C3] hover:text-[#5C4A32] transition-colors duration-150 disabled:opacity-50 active:scale-90"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8B7355] hover:bg-red-100 hover:text-red-600 transition-colors duration-150 disabled:opacity-50 active:scale-90"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
