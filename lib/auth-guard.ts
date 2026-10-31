import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AdminAuthResult {
  isAdmin: boolean;
  user: any | null;
  errorResponse: NextResponse | null;
}

/**
 * Checks that the incoming request is authenticated and the user has the 'admin' role.
 * Returns { isAdmin: true, user, errorResponse: null } on success,
 * or { isAdmin: false, user: null, errorResponse: NextResponse } on failure.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        isAdmin: false,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Unauthorized: Please log in." },
          { status: 401 }
        ),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || (profile as { role?: string }).role !== "admin") {
      return {
        isAdmin: false,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Forbidden: Administrator privileges required." },
          { status: 403 }
        ),
      };
    }

    return {
      isAdmin: true,
      user,
      errorResponse: null,
    };
  } catch (err) {
    console.error("[requireAdmin] Auth guard exception:", err);
    return {
      isAdmin: false,
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication verification failed." },
        { status: 401 }
      ),
    };
  }
}
