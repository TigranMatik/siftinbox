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
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-semibold text-[#5C4A32]">
          Good {getGreeting()}, {user.email?.split("@")[0] || "User"}
        </h1>
        <p className="text-[#8B7355] mt-1">
          {format(today, "EEEE, MMMM d")}
        </p>
      </div>

      {!hasConnections ? (
        <div className="animate-fade-in-up stagger-1">
          <EmptyState
            type="no-connection"
            title="Connect Your Email"
            description="Link your Gmail or Outlook account to start extracting action items from your inbox."
            actionLabel="Connect Email"
            actionHref="/dashboard/integrations"
          />
        </div>
      ) : !hasActions ? (
        <div className="animate-fade-in-up stagger-1">
          <EmptyState
            type="no-actions"
            title="You're all caught up!"
            description="No pending action items. Check back after your next email scan."
          />
        </div>
      ) : (
        <>
          {briefing && (
            <div className="animate-fade-in-up stagger-1">
              <DailyBriefing briefing={briefing} />
            </div>
          )}
          <div className="animate-fade-in-up stagger-2">
            <ActionList actions={actionItems} />
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}
