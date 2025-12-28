import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FFF3D5] border-8 border-[#C4A484]">
      <DashboardNav user={user} />
      <main className="container mx-auto px-8 py-6 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
