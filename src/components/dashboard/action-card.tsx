"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  MoreHorizontal,
  X,
  AlarmClock,
  User,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import type { ActionItem } from "@/types/database";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  action: ActionItem;
}

export function ActionCard({ action }: ActionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (status: "completed" | "dismissed" | "snoozed") => {
    setIsLoading(true);
    try {
      const updates: Partial<ActionItem> = { status };

      if (status === "snoozed") {
        // Snooze for 24 hours
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        updates.snoozed_until = tomorrow.toISOString();
      }

      const { error } = await supabase
        .from("action_items")
        .update(updates)
        .eq("id", action.id);

      if (error) throw error;

      toast.success(
        status === "completed"
          ? "Marked as complete"
          : status === "dismissed"
          ? "Action dismissed"
          : "Snoozed until tomorrow"
      );

      router.refresh();
    } catch (error) {
      console.error("Error updating action:", error);
      toast.error("Failed to update action");
    } finally {
      setIsLoading(false);
    }
  };

  const deadline = action.deadline ? new Date(action.deadline) : null;
  const isOverdue = deadline && isPast(deadline);
  const isDueToday = deadline && isToday(deadline);

  return (
    <div
      className={cn(
        "bg-[#FFF3D5] border border-[#C4A484]/30 rounded-2xl p-4 hover:border-[#C4A484]/50 transition-colors duration-150",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Complete button */}
        <button
          className="shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center text-[#8B7355] hover:text-green-600 hover:bg-green-100 transition-colors duration-150 active:scale-90"
          onClick={() => updateStatus("completed")}
          disabled={isLoading}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#5C4A32] mb-1">{action.title}</h3>
          <p className="text-sm text-[#8B7355] line-clamp-2">{action.description}</p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#8B7355]">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {action.sender_name}
            </span>

            {deadline && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-500",
                  isDueToday && !isOverdue && "text-yellow-600"
                )}
              >
                <Calendar className="w-3 h-3" />
                {isOverdue
                  ? `Overdue by ${formatDistanceToNow(deadline)}`
                  : isDueToday
                  ? `Due today at ${format(deadline, "h:mm a")}`
                  : `Due ${format(deadline, "MMM d")}`}
              </span>
            )}

            {action.deadline_source !== "none" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs border-[#C4A484]/50",
                  action.deadline_source === "explicit"
                    ? "text-[#C4A484]"
                    : "text-[#8B7355]"
                )}
              >
                {action.deadline_source === "explicit" ? "Explicit deadline" : "Inferred"}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#8B7355] hover:bg-[#F5E6C3] transition-colors duration-150 active:scale-90">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#FFF3D5] border-[#C4A484]/30 animate-scale-in">
            <DropdownMenuItem
              onClick={() => updateStatus("completed")}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Mark complete
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateStatus("snoozed")}
              className="cursor-pointer text-[#5C4A32] focus:bg-[#F5E6C3]"
            >
              <AlarmClock className="w-4 h-4 mr-2 text-[#C4A484]" />
              Snooze until tomorrow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateStatus("dismissed")}
              className="cursor-pointer text-red-500 focus:bg-[#F5E6C3]"
            >
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
