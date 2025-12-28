import { createClient } from "@/lib/supabase/server";
import { ActionList } from "@/components/dashboard/action-list";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const status = params.status || "pending";

  // Fetch action items based on status
  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("priority", { ascending: true })
    .order("deadline", { ascending: true, nullsFirst: false });

  const hasActions = actionItems && actionItems.length > 0;

  // Get counts for each status
  const { count: pendingCount } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  const { count: completedCount } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { count: dismissedCount } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "dismissed");

  const tabs = [
    { value: "pending", label: "Pending", count: pendingCount || 0, icon: Clock },
    { value: "completed", label: "Completed", count: completedCount || 0, icon: CheckCircle2 },
    { value: "dismissed", label: "Dismissed", count: dismissedCount || 0, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Action Items</h1>
        <p className="text-slate-400 mt-1">Manage all your extracted action items</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-4">
        {tabs.map((tab) => (
          <Link key={tab.value} href={`/dashboard/actions?status=${tab.value}`}>
            <Button
              variant="ghost"
              className={cn(
                "gap-2",
                status === tab.value
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-700 text-xs">
                {tab.count}
              </span>
            </Button>
          </Link>
        ))}
      </div>

      {/* Action list */}
      {hasActions ? (
        <ActionList actions={actionItems} />
      ) : (
        <EmptyState
          type="no-actions"
          title={`No ${status} actions`}
          description={
            status === "pending"
              ? "All caught up! You have no pending action items."
              : status === "completed"
              ? "No completed actions yet. Mark items as complete when you're done."
              : "No dismissed actions."
          }
        />
      )}
    </div>
  );
}
