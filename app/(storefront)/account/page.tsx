import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountProfileClient } from "@/components/storefront/account-profile-client";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <AccountProfileClient
      user={{ email: user.email ?? "", id: user.id }}
      profile={profile}
      recentOrders={recentOrders ?? []}
    />
  );
}
