import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmailConnectionCard } from "@/components/settings/email-connections";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import type { EmailConnection } from "@/types/database";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const params = await searchParams;
  const success = params.success;
  const error = params.error;

  // Fetch email connections
  const { data: connections } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: EmailConnection[] | null };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success === "gmail_connected" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-100 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <p>Gmail connected successfully! You can now scan your inbox.</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-100 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to connect Gmail. Please try again.</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#5C4A32]">Integrations</h1>
        <p className="text-[#8B7355]">Connect your email accounts to scan for action items</p>
      </div>

      {/* Connected accounts */}
      <div className="bg-[#F5E6C3] rounded-3xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#5C4A32]">Connected Accounts</h2>
          <p className="text-[#8B7355] text-sm mt-1">
            Your linked email accounts. We use read-only access to scan your inbox.
          </p>
        </div>
        <div className="space-y-4">
          {connections && connections.length > 0 ? (
            connections.map((connection) => (
              <EmailConnectionCard key={connection.id} connection={connection} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[#C4A484] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#FFF3D5]" />
              </div>
              <p className="text-[#5C4A32] font-medium">No email accounts connected yet.</p>
              <p className="text-sm text-[#8B7355] mt-2">
                Sign in with Google to connect your Gmail account.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Available integrations */}
      <div className="bg-[#F5E6C3] rounded-3xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#5C4A32]">Available Integrations</h2>
          <p className="text-[#8B7355] text-sm mt-1">
            Email providers you can connect
          </p>
        </div>
        <div className="space-y-4">
          {/* Gmail */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF3D5] border border-[#C4A484]/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[#C4A484]/20">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-[#5C4A32]">Gmail</h3>
                <p className="text-sm text-[#8B7355]">Connect via Google OAuth</p>
              </div>
            </div>
            {connections?.some(c => c.provider === "gmail") ? (
              <Badge className="bg-green-100 text-green-700 border-none px-3 py-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Link
                href="/api/integrations/gmail/connect"
                className="px-4 py-2 bg-[#5C4A32] text-[#FFF3D5] rounded-xl text-sm font-medium hover:bg-[#4A3A28] active:scale-95 transition-all duration-150"
              >
                Connect
              </Link>
            )}
          </div>

          {/* Outlook */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF3D5] border border-[#C4A484]/30 opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0078D4] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 16.26V9.09l7 3.5v7.17l-7-3.5zm9 3.5v-7.17l7-3.5v7.17l-7 3.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-[#5C4A32]">Outlook</h3>
                <p className="text-sm text-[#8B7355]">Connect via Microsoft OAuth</p>
              </div>
            </div>
            <Badge className="bg-[#C4A484]/20 text-[#8B7355] border border-[#C4A484]/30 px-3 py-1">
              Coming Soon
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
