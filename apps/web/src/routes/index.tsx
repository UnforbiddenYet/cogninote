import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "../lib/auth/authClient";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    // Check if session exists and has user data
    if (session?.data?.session) {
      throw redirect({ to: "/app" });
    } else {
      throw redirect({ to: "/auth/login" });
    }
  },
});
