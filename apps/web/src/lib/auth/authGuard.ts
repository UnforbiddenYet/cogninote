import { redirect } from "@tanstack/react-router";
import { authClient } from "./authClient";

/**
 * Auth guard for protected routes.
 * Use in route's beforeLoad to ensure user is authenticated.
 * Throws redirect to login if not authenticated.
 *
 * @example
 * export const Route = createFileRoute("/app")({
 *   beforeLoad: async () => await requireAuth(),
 *   component: AppLayout,
 * });
 */
export async function requireAuth() {
  const session = await authClient.getSession();

  // Check if session exists and has user data
  if (!session?.data?.session) {
    throw redirect({ to: "/auth/login" });
  }

  return { session: session.data };
}
