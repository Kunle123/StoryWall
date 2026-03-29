import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/utils/admin";

/** Signed-in Clerk user only (e.g. image upload). */
export async function requireAuthUserId(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId };
}

/**
 * Admin-only routes: signed in + email in `lib/utils/admin.ts` (ADMIN_EMAILS).
 * Extend that list for additional operators.
 */
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuthUserId();
  if (!authResult.ok) return authResult;

  let user;
  try {
    user = await currentUser();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to resolve user" },
        { status: 500 }
      ),
    };
  }

  const email = user?.emailAddresses[0]?.emailAddress ?? null;
  if (!isAdminEmail(email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: authResult.userId };
}
