import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimUserOrdersByEmail } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Auto-claim any unlinked orders with user's email
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          await claimUserOrdersByEmail(user.id, user.email);
        }
      } catch (claimErr) {
        console.warn("[auth/callback] Auto-claim notice:", claimErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
