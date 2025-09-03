import type { PrismaClient } from "@prisma/client/extension";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function refreshSupabaseToken(): Promise<{
  success: boolean;
  client?: PrismaClient;
  error?: string;
}> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!refreshToken) {
    return { success: false, error: "No refresh token available" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      // Clear invalid tokens
      cookieStore.delete("access-token");
      cookieStore.delete("refresh-token");
      return { success: false, error: "Failed to refresh token" };
    }

    // Update cookies with new tokens
    cookieStore.set("access-token", data.session.access_token, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    if (data.session.refresh_token) {
      cookieStore.set("refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Return new client with refreshed token
    const newClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        },
      }
    );

    return { success: true, client: newClient };
  } catch (error) {
    console.error("Token refresh error:", error);
    return { success: false, error: "Token refresh failed" };
  }
}
