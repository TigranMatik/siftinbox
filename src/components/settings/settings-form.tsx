"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Clock, Bell, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

interface SettingsFormProps {
  profile: Profile | null;
}

const timezones = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export function SettingsForm({ profile }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scanTime, setScanTime] = useState(profile?.scan_time || "08:00:00");
  const [timezone, setTimezone] = useState(profile?.timezone || "America/Los_Angeles");
  const [emailNotifications, setEmailNotifications] = useState(
    (profile?.notification_preferences as { email?: boolean })?.email ?? true
  );
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          scan_time: scanTime,
          timezone,
          notification_preferences: { email: emailNotifications, push: false },
        });

      if (error) throw error;

      toast.success("Settings saved");
      router.refresh();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scan Schedule */}
      <div className="bg-[#F5E6C3] rounded-3xl p-6 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#C4A484] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#FFF3D5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#5C4A32]">Daily Scan Schedule</h2>
            <p className="text-sm text-[#8B7355]">
              When should we scan your inbox and prepare your daily briefing?
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div className="space-y-2">
            <label htmlFor="scan-time" className="text-sm font-medium text-[#5C4A32]">
              Scan Time
            </label>
            <input
              id="scan-time"
              type="time"
              value={scanTime.slice(0, 5)}
              onChange={(e) => setScanTime(e.target.value + ":00")}
              className="w-full h-12 px-4 bg-[#FFF3D5] border border-[#C4A484]/30 rounded-xl text-[#5C4A32] focus:outline-none focus:ring-2 focus:ring-[#C4A484] transition-colors duration-150 hover:border-[#C4A484]/50"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium text-[#5C4A32]">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-12 px-4 bg-[#FFF3D5] border border-[#C4A484]/30 rounded-xl text-[#5C4A32] focus:outline-none focus:ring-2 focus:ring-[#C4A484] transition-colors duration-150 hover:border-[#C4A484]/50 cursor-pointer"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#F5E6C3] rounded-3xl p-6 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#C4A484] flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#FFF3D5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#5C4A32]">Notifications</h2>
            <p className="text-sm text-[#8B7355]">
              How should we notify you about your daily briefing?
            </p>
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#FFF3D5] rounded-xl border border-[#C4A484]/30 transition-colors duration-150 hover:border-[#C4A484]/50">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="w-5 h-5 rounded border-[#C4A484] bg-[#FFF3D5] text-[#C4A484] focus:ring-[#C4A484] focus:ring-offset-[#F5E6C3]"
          />
          <div>
            <p className="text-[#5C4A32] font-medium">Email notifications</p>
            <p className="text-sm text-[#8B7355]">
              Receive your daily briefing summary via email
            </p>
          </div>
        </label>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="inline-flex items-center justify-center h-12 px-6 bg-[#C4A484] text-white font-medium rounded-xl hover:bg-[#A68B6A] transition-all duration-150 disabled:opacity-50 active:scale-95 animate-fade-in-up stagger-3"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Save className="w-5 h-5 mr-2" />
        )}
        Save Settings
      </button>
    </div>
  );
}
