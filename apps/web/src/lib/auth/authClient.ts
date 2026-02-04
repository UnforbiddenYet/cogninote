import { createAuthClient } from "better-auth/react";

const API_URL =
  (typeof window !== "undefined" && (window as any).__API_URL__) ||
  "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
