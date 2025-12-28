"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Zap, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScanningToast } from "./scanning-toast";

interface NewScanButtonProps {
  connectionId?: string;
}

export function NewScanButton({ connectionId }: NewScanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleScanNow = async () => {
    if (!connectionId) {
      toast.error("No email connected", {
        description: "Go to Integrations to connect your Gmail account.",
      });
      return;
    }

    setIsLoading(true);
    setIsOpen(false);

    try {
      // First, get the count of emails to scan
      const countResponse = await fetch(`/api/emails/count?connectionId=${connectionId}`);
      const countData = await countResponse.json();

      if (countData.error) {
        throw new Error(countData.error);
      }

      const totalEmails = countData.count || 0;

      if (totalEmails === 0) {
        toast.success("No new emails to scan", {
          description: "Your inbox is already up to date.",
        });
        setIsLoading(false);
        return;
      }

      // Show scanning toast - it will perform the actual scan
      toast.custom(
        (t) => (
          <ScanningToast
            totalEmails={totalEmails}
            connectionId={connectionId}
            onComplete={(actionsFound) => {
              router.refresh();
              // Auto-dismiss after 5 seconds if completed successfully
              setTimeout(() => toast.dismiss(t), 5000);
            }}
            onDismiss={() => toast.dismiss(t)}
          />
        ),
        {
          duration: Infinity,
        }
      );
    } catch (error) {
      console.error("Error scanning:", error);
      toast.error("Failed to start scan", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleScan = async (minutes: number) => {
    if (!connectionId) {
      toast.error("No email connected. Connect your email first.");
      return;
    }

    setIsLoading(true);
    setIsOpen(false);
    setShowSchedule(false);

    const scheduledTime = new Date(Date.now() + minutes * 60 * 1000);
    const timeString = scheduledTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });

    try {
      const response = await fetch("/api/emails/schedule-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          scheduledFor: scheduledTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule");

      toast.success(`Scan scheduled for ${timeString}`, {
        description: "You'll have fresh action items when you're back.",
      });
    } catch (error) {
      console.error("Error scheduling:", error);
      toast.error("Failed to schedule scan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomTimeSchedule = async () => {
    if (!connectionId || !customTime) {
      return;
    }

    setIsLoading(true);
    setIsOpen(false);
    setShowSchedule(false);
    setShowTimePicker(false);

    // Parse the time and create a date for today (or tomorrow if time has passed)
    const [hours, minutes] = customTime.split(":").map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeString = scheduledTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
    const isToday = scheduledTime.toDateString() === new Date().toDateString();

    try {
      const response = await fetch("/api/emails/schedule-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          scheduledFor: scheduledTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule");

      toast.success(`Scan scheduled for ${timeString}${!isToday ? " tomorrow" : ""}`, {
        description: "You'll have fresh action items when you're back.",
      });
    } catch (error) {
      console.error("Error scheduling:", error);
      toast.error("Failed to schedule scan");
    } finally {
      setIsLoading(false);
      setCustomTime("");
    }
  };

  if (!connectionId) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset states when closing
      setShowSchedule(false);
      setShowTimePicker(false);
      setCustomTime("");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isLoading}
          className="w-10 h-10 rounded-xl bg-[#5C4A32] text-[#FFF3D5] flex items-center justify-center hover:bg-[#4A3A28] active:scale-95 transition-all duration-150 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-[#FFF3D5] border-[#C4A484]/30"
      >
        {!showSchedule && !showTimePicker ? (
          <>
            <DropdownMenuItem
              onClick={handleScanNow}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              <Zap className="w-4 h-4 mr-2 text-[#C4A484]" />
              Scan now
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#C4A484]/20" />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setShowSchedule(true);
              }}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              <Clock className="w-4 h-4 mr-2 text-[#C4A484]" />
              Schedule scan
            </DropdownMenuItem>
          </>
        ) : showTimePicker ? (
          <div className="p-2">
            <p className="text-xs font-medium text-[#8B7355] mb-2">
              Pick a time
            </p>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full h-10 px-3 bg-[#FFF3D5] border border-[#C4A484]/30 rounded-lg text-[#5C4A32] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A484]"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setShowTimePicker(false);
                  setShowSchedule(true);
                  setCustomTime("");
                }}
                className="flex-1 px-3 py-2 text-sm text-[#8B7355] hover:bg-[#F5E6C3] rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCustomTimeSchedule}
                disabled={!customTime}
                className="flex-1 px-3 py-2 text-sm bg-[#5C4A32] text-[#FFF3D5] rounded-lg hover:bg-[#4A3A28] disabled:opacity-50 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-[#8B7355]">
              Scan in...
            </div>
            <DropdownMenuItem
              onClick={() => handleScheduleScan(30)}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              30 minutes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleScheduleScan(60)}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              1 hour
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleScheduleScan(120)}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              2 hours
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#C4A484]/20" />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setShowTimePicker(true);
              }}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              Pick a time...
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#C4A484]/20" />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setShowSchedule(false);
              }}
              className="cursor-pointer text-[#8B7355] focus:bg-[#F5E6C3]"
            >
              ← Back
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
