import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailConnectionCard } from "@/components/settings/email-connections";
import { Mail, CheckCircle2 } from "lucide-react";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch email connections
  const { data: connections } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-slate-400 mt-1">Connect your email accounts to scan for action items</p>
      </div>

      {/* Connected accounts */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Connected Accounts</CardTitle>
          <CardDescription className="text-slate-400">
            Your linked email accounts. We use read-only access to scan your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections && connections.length > 0 ? (
            connections.map((connection) => (
              <EmailConnectionCard key={connection.id} connection={connection} />
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>No email accounts connected yet.</p>
              <p className="text-sm mt-2">
                Sign in with Google to connect your Gmail account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available integrations */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Available Integrations</CardTitle>
          <CardDescription className="text-slate-400">
            Email providers you can connect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Gmail</h3>
                <p className="text-sm text-slate-400">Connect via Google OAuth</p>
              </div>
            </div>
            {connections?.some(c => c.provider === "gmail") ? (
              <Badge className="bg-green-500/20 text-green-400 border-none">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                Available
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-700 opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 16.26V9.09l7 3.5v7.17l-7-3.5zm9 3.5v-7.17l7-3.5v7.17l-7 3.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Outlook</h3>
                <p className="text-sm text-slate-400">Connect via Microsoft OAuth</p>
              </div>
            </div>
            <Badge variant="outline" className="border-slate-600 text-slate-400">
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
