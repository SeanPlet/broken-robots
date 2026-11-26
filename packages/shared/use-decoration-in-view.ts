import { useEffect, useRef } from "react";

// Decorative motion stays paused until its own region enters the viewport.
export function useDecorationInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      element.toggleAttribute("data-decoration-in-view", entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
