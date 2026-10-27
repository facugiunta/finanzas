import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { ChatProvider } from "@/components/ai/chat-context";
import { ToastProvider } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guard adicional a nivel de layout (además del middleware).
    if (!user) {
      redirect("/login");
    }
    email = user.email ?? null;
  }

  return (
    <ToastProvider>
      <ChatProvider>
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar email={email} />
          <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
        </div>
      </ChatProvider>
    </ToastProvider>
  );
}
