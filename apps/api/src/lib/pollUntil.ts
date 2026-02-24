import { SECOND_MS } from "./time";

export async function pollUntil(
  predicate: () => Promise<boolean>,
  { interval = SECOND_MS, timeout = 30 * SECOND_MS } = {},
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}
