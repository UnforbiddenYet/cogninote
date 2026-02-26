import { createAuthClient } from "better-auth/react";

const BETTER_AUTH_BASE_URL = import.meta.env.VITE_BETTER_AUTH_BASE_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_BASE_URL,
});

export const { useSession, signIn, signUp, signOut } = authClient;
