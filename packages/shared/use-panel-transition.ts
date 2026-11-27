import { useLayoutEffect, useRef } from "react";

// Keep the outgoing panel on screen until its replacement has faded in.
// Only the selected panel participates in layout or keyboard navigation.
export function usePanelTransition(
  selected: string,
  style: "gallery" | "collection",
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = useRef<HTMLElement[]>([]);
  const height = useRef(0);
  const animations = useRef<Animation[]>([]);
  const generation = useRef(0);

  useLayoutEffect(() => {
    const container = containerRef.current!;
    const observer = new ResizeObserver(([entry]) => {
      height.current = entry.contentRect.height;
    });
    if (style === "collection") observer.observe(container);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      if (preference.matches)
        animations.current.forEach((animation) => animation.finish());
    };
    preference.addEventListener("change", finish);
    return () => {
      generation.current++;
      observer.disconnect();
      preference.removeEventListener("change", finish);
      animations.current.forEach((animation) => animation.cancel());
    };
  }, [style]);

  useLayoutEffect(() => {
    const container = containerRef.current!;
    const panels = Array.from(
      container.querySelectorAll<HTMLElement>(":scope > [data-panel-key]"),
    );
    const incoming = panels.find(
      (panel) => panel.dataset.panelKey === selected,
    )!;
    const layers = visible.current;
    const gallery = style === "gallery";
    const startHeight = container.getAnimations().length
      ? container.getBoundingClientRect().height
      : height.current;
    // Preserve what's actually on screen when a new selection interrupts a fade.
    const frames = new Map(
      layers.map((panel) => {
        panel.hidden = false;
        const computed = getComputedStyle(panel);
        return [
          panel,
          { opacity: computed.opacity, transform: computed.transform },
        ];
      }),
    );
    const run = ++generation.current;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];

    function settle() {
      for (const panel of panels) {
        panel.hidden = panel !== incoming;
        panel.style.opacity = "";
        panel.style.zIndex = "";
      }
      visible.current = [incoming];
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      delete container.dataset.transitioning;
      if (!gallery) height.current = container.getBoundingClientRect().height;
    }

    if (
      layers.length === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      settle();
      return;
    }

    container.dataset.transitioning = "true";
    const stack = layers.includes(incoming) ? layers : [...layers, incoming];
    visible.current = stack;
    const selectedLayer = stack.indexOf(incoming);
    const timing = {
      duration: gallery ? 480 : 520,
      easing: "ease-in-out",
      fill: "both",
    } as const;
    stack.forEach((panel, index) => {
      panel.style.zIndex = String(index + 1);
      const frame = frames.get(panel);
      const opacity = frame?.opacity ?? "0";
      if (gallery && index < selectedLayer) {
        // Keep the base opaque so the frame's dark background can't show through.
        panel.style.opacity = opacity;
        return;
      }
      panel.style.opacity = "";
      const active = panel === incoming;
      const transform = "none";
      animations.current.push(
        panel.animate(
          [
            { opacity, transform },
            { opacity: active ? 1 : 0, transform: active ? "none" : transform },
          ],
          gallery
            ? timing
            : {
                ...timing,
                duration: active ? 280 : 160,
                delay: active ? 100 : 0,
                easing: "ease-out",
              },
        ),
      );
    });

    const targetHeight = gallery ? 0 : incoming.getBoundingClientRect().height;
    const distance = Math.abs(startHeight - targetHeight);
    if (!gallery && startHeight > 0 && distance > 1) {
      animations.current.push(
        container.animate(
          [{ height: `${startHeight}px` }, { height: `${targetHeight}px` }],
          {
            duration: 440,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "both",
          },
        ),
      );
    }
    void Promise.all(animations.current.map((animation) => animation.finished))
      .then(() => {
        if (generation.current === run) settle();
      })
      .catch(() => {
        // A newer selection or unmount cancels this transition.
      });
  }, [selected, style]);

  return containerRef;
}
