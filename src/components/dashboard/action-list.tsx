"use client";

import { ActionCard } from "./action-card";
import type { ActionItem } from "@/types/database";

interface ActionListProps {
  actions: ActionItem[];
}

export function ActionList({ actions }: ActionListProps) {
  const highPriority = actions.filter((a) => a.priority === "high");
  const mediumPriority = actions.filter((a) => a.priority === "medium");
  const lowPriority = actions.filter((a) => a.priority === "low");

  return (
    <div className="space-y-6">
      {highPriority.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#5C4A32] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            High Priority
          </h2>
          <div className="space-y-3">
            {highPriority.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </section>
      )}

      {mediumPriority.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#5C4A32] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Medium Priority
          </h2>
          <div className="space-y-3">
            {mediumPriority.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </section>
      )}

      {lowPriority.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#5C4A32] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B7355]" />
            Low Priority
          </h2>
          <div className="space-y-3">
            {lowPriority.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
