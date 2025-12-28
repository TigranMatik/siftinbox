"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, CheckSquare, Link2, Settings, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/actions", label: "Actions", icon: CheckSquare },
  { href: "/dashboard/integrations", label: "Integrations", icon: Link2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ user }: { user: SupabaseUser }) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="w-full flex justify-center pt-6 pb-4 animate-fade-in-down">
      <div className="flex items-center gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="text-lg font-bold text-[#5C4A32]">
          Fast Action
        </Link>

        {/* Floating Nav Pills */}
        <nav className="flex items-center bg-[#F5E6C3] rounded-full p-1.5 border border-[#C4A484]/30 shadow-sm">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 active:scale-95",
                  isActive
                    ? "bg-[#FFF3D5] text-[#5C4A32] shadow-sm border border-[#C4A484]/20"
                    : "text-[#5C4A32] hover:bg-[#FFF3D5]/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="w-10 h-10 rounded-full bg-[#F5E6C3] border border-[#C4A484]/30 flex items-center justify-center hover:bg-[#C4A484]/20 active:scale-95 transition-all duration-150">
              <User className="w-5 h-5 text-[#5C4A32]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#FFF3D5] border-[#C4A484]/30 animate-scale-in">
            <DropdownMenuItem className="text-[#8B7355] transition-colors duration-150">
              <span className="truncate">{user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="transition-colors duration-150 hover:bg-[#F5E6C3]">
              <Link href="/dashboard/settings" className="cursor-pointer text-[#5C4A32]">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer transition-colors duration-150 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
