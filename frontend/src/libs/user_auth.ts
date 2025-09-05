import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function getAuthUserClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access-token")?.value;
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!accessToken) return null;

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  // Check if token is still valid
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error && error.message.includes("expired") && refreshToken) {
    // Try to refresh the token
    const { data, error: refreshError } = await userClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!refreshError && data.session) {
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

      // Return a new client with the refreshed token
      return createClient(
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
    }

    // If refresh failed, clear cookies and return null
    cookieStore.delete("access-token");
    cookieStore.delete("refresh-token");
    return null;
  }

  if (error || !user) {
    return null;
  }

  return userClient;
}

export async function isUserAuthenticated(): Promise<boolean> {
  const userClient = await getAuthUserClient();
  if (!userClient) return false;

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error);
    return false;
  }
  return !!user;
}
