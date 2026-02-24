import { useEffect, useRef, useState } from "react";

export function useScrollHide(active: boolean, rootMargin: string) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!active) {
      setHidden(false);
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => setHidden(!entry.isIntersecting), {
      threshold: 0,
      rootMargin,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [active, rootMargin]);

  return { sentinelRef, hidden };
}
