import { createClient } from "@/lib/supabase/server";
import { DailyBriefing } from "@/components/dashboard/daily-briefing";
import { ActionList } from "@/components/dashboard/action-list";
import { EmptyState } from "@/components/dashboard/empty-state";
import { format } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch today's action items
  const today = new Date();
  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("deadline", { ascending: true, nullsFirst: false });

  // Fetch today's briefing
  const { data: briefing } = await supabase
    .from("daily_briefings")
    .select("*")
    .eq("user_id", user.id)
    .eq("briefing_date", format(today, "yyyy-MM-dd"))
    .single();

  // Fetch email connections
  const { data: connections } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const hasConnections = connections && connections.length > 0;
  const hasActions = actionItems && actionItems.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Good {getGreeting()}, {user.email?.split("@")[0]}
        </h1>
        <p className="text-slate-400 mt-1">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {!hasConnections ? (
        <EmptyState
          type="no-connection"
          title="Connect your email"
          description="Link your Gmail or Outlook account to start extracting action items from your inbox."
          actionLabel="Connect Email"
          actionHref="/dashboard/integrations"
        />
      ) : !hasActions ? (
        <EmptyState
          type="no-actions"
          title="You're all caught up!"
          description="No pending action items. Check back after your next email scan."
        />
      ) : (
        <>
          {briefing && <DailyBriefing briefing={briefing} />}
          <ActionList actions={actionItems} />
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
