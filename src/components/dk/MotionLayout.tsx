import { useEffect, useRef, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Content stays visible without JavaScript; motion is enabled after hydration. */
export function MotionLayout({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const root = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || preference.matches || !("IntersectionObserver" in window)) return;

    const tracked = new Set<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("motion-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

    const register = () => {
      root.querySelectorAll<HTMLElement>("[data-motion], .motion-card, section:not(.isolate) > h1, section:not(.isolate) > p, section > .grid > .shadow-soft, section ol > li").forEach((element) => {
        if (tracked.has(element)) return;
        tracked.add(element);
        element.classList.add("motion-ready");
        observer.observe(element);
      });
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true });
    const showAll = () => {
      if (!preference.matches) return;
      observer.disconnect();
      tracked.forEach((element) => element.classList.add("motion-visible"));
    };
    preference.addEventListener("change", showAll);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", showAll);
      tracked.forEach((element) => element.classList.remove("motion-ready", "motion-visible"));
    };
  }, [pathname]);

  return <main ref={ref} className="motion-layout">{children}</main>;
}