import { createClient } from "@/lib/supabase/server";
import { ActionList } from "@/components/dashboard/action-list";
import { NewScanButton } from "@/components/dashboard/new-scan-button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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

  // Fetch first active email connection for the scan button
  const { data: connections } = await supabase
    .from("email_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const connectionId = connections?.[0]?.id;
  const hasActions = actionItems && actionItems.length > 0;

  const tabs = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "dismissed", label: "Dismissed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold text-[#5C4A32]">Action Items</h1>
          <p className="text-[#8B7355]">Manage all your extracted action items</p>
        </div>
        <NewScanButton connectionId={connectionId} />
      </div>

      {/* Main Card */}
      <div className="bg-[#F5E6C3] rounded-3xl p-6 min-h-[500px] animate-fade-in-up stagger-1">
        {/* Status tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {tabs.map((tab, index) => (
            <Link key={tab.value} href={`/dashboard/actions?status=${tab.value}`}>
              <button
                className={cn(
                  "px-6 py-2.5 rounded-full text-base font-medium transition-all duration-150 border-2 active:scale-95",
                  status === tab.value
                    ? "bg-[#C4A484] text-[#5C4A32] border-[#5C4A32] shadow-md"
                    : "bg-transparent text-[#5C4A32] border-[#5C4A32] hover:bg-[#C4A484]/20"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {tab.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Action list or Empty state */}
        {hasActions ? (
          <div className="animate-fade-in">
            <ActionList actions={actionItems} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
            {/* Icon */}
            <div className="w-24 h-24 rounded-2xl bg-[#C4A484] flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-[#F5E6C3]" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-[#5C4A32] mb-2 animate-fade-in-up stagger-1">
              No {status.charAt(0).toUpperCase() + status.slice(1)} Actions
            </h2>

            {/* Description */}
            <p className="text-lg text-[#8B7355] animate-fade-in-up stagger-2">
              {status === "pending"
                ? "All caught up! You have no pending action items."
                : status === "completed"
                ? "No completed actions yet. Mark items as complete when you're done."
                : "No dismissed actions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
