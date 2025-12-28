"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2 } from "lucide-react";
import type { DailyBriefing as BriefingType } from "@/types/database";

interface DailyBriefingProps {
  briefing: BriefingType;
}

export function DailyBriefing({ briefing }: DailyBriefingProps) {
  return (
    <div className="bg-[#F5E6C3] rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#C4A484] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#FFF3D5]" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#5C4A32]">Today's Briefing</h2>
        </div>
        <Badge className="bg-[#C4A484]/20 text-[#5C4A32] border border-[#C4A484]/30 px-3 py-1">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {briefing.action_count} action{briefing.action_count !== 1 ? "s" : ""}
        </Badge>
      </div>
      <p className="text-[#5C4A32] leading-relaxed">{briefing.summary}</p>
    </div>
  );
}
