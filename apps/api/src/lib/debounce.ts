/**
 * Creates a debouncer keyed by an arbitrary string.
 * Calling schedule() with the same key resets the timer.
 */
export function createDebouncer(defaultDelayMs: number) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return function schedule(key: string, fn: () => void, delayMs = defaultDelayMs) {
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);

    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        fn();
      }, delayMs),
    );
  };
}
