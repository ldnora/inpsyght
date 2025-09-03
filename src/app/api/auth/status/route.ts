import { NextResponse } from "next/server";
import { isUserAuthenticated } from "@/libs/user_auth";

export async function GET() {
  try {
    const authenticated = await isUserAuthenticated();

    return NextResponse.json({
      isAuthenticated: authenticated,
    });
  } catch (error) {
    console.error("Error checking auth status:", error);
    return NextResponse.json({
      isAuthenticated: false,
    });
  }
}
