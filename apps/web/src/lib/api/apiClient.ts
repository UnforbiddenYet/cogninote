import { hcWithType, type InferRequestType } from "@api-server/hc";
export {
  type InferRequestType,
  DetailedError as APIDetailedError,
  parseResponse,
} from "@api-server/hc";

export type InferReqJson<T extends (...args: any) => any> = InferRequestType<T>["json"];
export type InferReqQuery<T extends (...args: any) => any> = InferRequestType<T>["query"];
export type InferPathParam<
  T extends (...args: any) => any,
  K extends keyof InferRequestType<T>["param"],
> = InferRequestType<T>["param"][K];

const API_URL =
  (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";

export const honoClient = hcWithType(API_URL, {
  init: {
    credentials: "include",
  },
});
