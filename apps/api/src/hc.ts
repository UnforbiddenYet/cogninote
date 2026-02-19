import { hc } from "hono/client";
import type { AppType } from "./app";

const client = hc<AppType>("");
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<AppType>(...args);

export {
  parseResponse,
  type InferRequestType,
  DetailedError,
} from "hono/client";
