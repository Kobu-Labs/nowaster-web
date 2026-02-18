import { SignInCard } from "@/components/auth/SignInCard";
import type { User } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function SignInPage() {
  const cookieStore = await cookies();
  const userHint = cookieStore.get("user_hint")?.value;
  let existingUser: null | User = null;
  if (userHint) {
    try {
      existingUser = JSON.parse(userHint) as User;
    } catch {
      // invalid cookie value — treat as unauthenticated
    }
  }

  return <SignInCard existingUser={existingUser} />;
}
