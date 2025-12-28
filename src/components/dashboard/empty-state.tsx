import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

interface EmptyStateProps {
  type: "no-connection" | "no-actions";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ type, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="bg-[#F5E6C3] rounded-3xl p-12">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-[#C4A484] flex items-center justify-center mb-6">
          {type === "no-connection" ? (
            <Mail className="w-10 h-10 text-[#FFF3D5]" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-[#FFF3D5]" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-[#5C4A32] mb-3">{title}</h2>

        {/* Description */}
        <p className="text-[#8B7355] max-w-sm mb-8 leading-relaxed">{description}</p>

        {/* Action Button */}
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="px-6 py-3 bg-[#C4A484] text-white font-medium rounded-xl hover:bg-[#A68B6A] transition-all duration-150 active:scale-95"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
