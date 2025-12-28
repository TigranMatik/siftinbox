export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EmailProvider = "gmail" | "outlook";
export type DeadlineSource = "explicit" | "inferred" | "none";
export type Priority = "high" | "medium" | "low";
export type ActionStatus = "pending" | "completed" | "dismissed" | "snoozed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          scan_time: string;
          timezone: string;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          scan_time?: string;
          timezone?: string;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scan_time?: string;
          timezone?: string;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_connections: {
        Row: {
          id: string;
          user_id: string;
          provider: EmailProvider;
          access_token: string;
          refresh_token: string;
          email_address: string;
          is_active: boolean;
          last_sync_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: EmailProvider;
          access_token: string;
          refresh_token: string;
          email_address: string;
          is_active?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: EmailProvider;
          access_token?: string;
          refresh_token?: string;
          email_address?: string;
          is_active?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
        };
      };
      emails_processed: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          external_id: string;
          subject: string;
          sender: string;
          received_at: string;
          processed_at: string;
          is_actionable: boolean;
          raw_content: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id: string;
          external_id: string;
          subject: string;
          sender: string;
          received_at: string;
          processed_at?: string;
          is_actionable?: boolean;
          raw_content?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string;
          external_id?: string;
          subject?: string;
          sender?: string;
          received_at?: string;
          processed_at?: string;
          is_actionable?: boolean;
          raw_content?: string | null;
        };
      };
      action_items: {
        Row: {
          id: string;
          user_id: string;
          email_id: string;
          title: string;
          description: string;
          sender_name: string;
          sender_email: string;
          deadline: string | null;
          deadline_source: DeadlineSource;
          priority: Priority;
          status: ActionStatus;
          snoozed_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_id: string;
          title: string;
          description: string;
          sender_name: string;
          sender_email: string;
          deadline?: string | null;
          deadline_source?: DeadlineSource;
          priority?: Priority;
          status?: ActionStatus;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_id?: string;
          title?: string;
          description?: string;
          sender_name?: string;
          sender_email?: string;
          deadline?: string | null;
          deadline_source?: DeadlineSource;
          priority?: Priority;
          status?: ActionStatus;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_briefings: {
        Row: {
          id: string;
          user_id: string;
          briefing_date: string;
          summary: string;
          action_count: number;
          sent_at: string;
          viewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          briefing_date: string;
          summary: string;
          action_count: number;
          sent_at?: string;
          viewed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          briefing_date?: string;
          summary?: string;
          action_count?: number;
          sent_at?: string;
          viewed_at?: string | null;
        };
      };
      scheduled_scans: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          scheduled_for: string;
          status: "pending" | "completed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id: string;
          scheduled_for: string;
          status?: "pending" | "completed" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string;
          scheduled_for?: string;
          status?: "pending" | "completed" | "failed";
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      email_provider: EmailProvider;
      deadline_source: DeadlineSource;
      priority: Priority;
      action_status: ActionStatus;
    };
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type EmailConnection = Database["public"]["Tables"]["email_connections"]["Row"];
export type EmailProcessed = Database["public"]["Tables"]["emails_processed"]["Row"];
export type ActionItem = Database["public"]["Tables"]["action_items"]["Row"];
export type DailyBriefing = Database["public"]["Tables"]["daily_briefings"]["Row"];
export type ScheduledScan = Database["public"]["Tables"]["scheduled_scans"]["Row"];
