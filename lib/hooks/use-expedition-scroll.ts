"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CHAPTERS,
  OCEAN_TRANSITION,
  chapterAtProgress,
  depthAtProgress,
  depthGaugePosition,
  normalizedScroll,
  oceanZoneStable,
  panelOpacity,
} from "@/lib/animation/journey";
import { smoothstep } from "@/lib/ocean";

export function useExpeditionScroll(
  root: RefObject<HTMLElement | null>,
  progress: RefObject<{ value: number }>,
  reducedMotion: boolean,
) {
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const panels = Array.from(
      element.querySelectorAll<HTMLElement>(".story-panel"),
    );
    if (reducedMotion) {
      panels.forEach((panel) => {
        panel.removeAttribute("aria-hidden");
        panel.inert = false;
        panel.removeAttribute("style");
      });
      element.setAttribute("data-environment", "space");
      element.setAttribute("data-underwater", "false");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const depthText = element.querySelector<HTMLElement>("[data-depth]");
    const zoneText = element.querySelector<HTMLElement>("[data-zone]");
    const chapterText = element.querySelector<HTMLElement>("[data-chapter]");
    const chapterNumber = element.querySelector<HTMLElement>(
      "[data-chapter-number]",
    );
    const dots = Array.from(
      element.querySelectorAll<HTMLElement>(".chapter-dot"),
    );
    let previousChapter = -1;
    let previousDepth = -1;
    let previousZone: string | null = "SUNLIT ZONE";
    let lastAnnouncedDepth = 0;
    const gaugeFill = element.querySelector<HTMLElement>(".depth-fill");
    const depthStatus = element.querySelector<HTMLElement>("[data-depth-status]");
    const draw = () => {
      const p = progress.current.value;
      element.style.setProperty("--journey-progress", String(p));
      element.style.setProperty(
        "--dive-opacity",
        String(smoothstep(OCEAN_TRANSITION.start, OCEAN_TRANSITION.end, p)),
      );
      element.setAttribute(
        "data-environment",
        p >= OCEAN_TRANSITION.end ? "ocean" : "space",
      );
      // Underwater begins with the crossfade so gauge/depth never disagree.
      element.setAttribute(
        "data-underwater",
        String(p >= OCEAN_TRANSITION.end && p < 0.91),
      );
      element.setAttribute("data-revealed", String(p >= 0.91));
      const depth = Math.round(depthAtProgress(p));
      if (depth !== previousDepth) {
        if (depthText) {
          depthText.textContent = depth.toLocaleString("en");
        }
        const zone = oceanZoneStable(depth, previousZone);
        const zoneChanged = zone !== previousZone;
        previousZone = zone;
        if (zoneText && zoneChanged) zoneText.textContent = zone;
        // Throttled SR announcement: every 100m or on zone change only.
        if (
          depthStatus &&
          (zoneChanged || Math.abs(depth - lastAnnouncedDepth) >= 100)
        ) {
          depthStatus.textContent = `${depth.toLocaleString("en")} metres, ${zone.toLowerCase()}`;
          lastAnnouncedDepth = depth;
        }
        const gaugeT = depthGaugePosition(depth);
        element.style.setProperty("--depth-progress", String(gaugeT));
        // Keep the fill element in sync for browsers without var() in calc().
        if (gaugeFill) gaugeFill.style.height = `${gaugeT * 100}%`;
        previousDepth = depth;
      }
      panels.forEach((panel, index) => {
        const opacity = panelOpacity(index, p);
        panel.style.opacity = String(opacity);
        panel.style.visibility = opacity > 0.005 ? "visible" : "hidden";
        // Eased lift + subtle scale so motion feels intentional, not linear.
        const eased = 1 - (1 - opacity) * (1 - opacity);
        panel.style.transform = `translateY(${(1 - eased) * 16}px) scale(${(0.985 + 0.015 * eased).toFixed(4)})`;
        const hidden = opacity < 0.2;
        if (hidden) panel.setAttribute("aria-hidden", "true");
        else panel.removeAttribute("aria-hidden");
        panel.inert = hidden;
      });
      const chapter = chapterAtProgress(p);
      if (chapter !== previousChapter) {
        if (chapterText) chapterText.textContent = CHAPTERS[chapter].name;
        if (chapterNumber)
          chapterNumber.textContent = String(chapter + 1).padStart(2, "0");
        dots.forEach((dot, i) => {
          const active = i === chapter;
          dot.dataset.active = String(active);
          if (active) dot.setAttribute("aria-current", "step");
          else dot.removeAttribute("aria-current");
        });
        previousChapter = chapter;
      }
    };

    // Explicit endpoints prevent a restored scene value becoming the tween's new start.
    const tween = gsap.fromTo(
      progress.current,
      { value: 0 },
      {
        value: 1,
        ease: "none",
        immediateRender: false,
        onUpdate: draw,
        scrollTrigger: {
          trigger: element,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    );
    const trigger = tween.scrollTrigger!;
    let frame = 0;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let oldDistance = element.offsetHeight - window.innerHeight;
    let oldViewport = `${window.innerWidth}:${window.innerHeight}`;
    const synchronize = () => {
      trigger.refresh();
      const value = normalizedScroll(
        window.scrollY - element.offsetTop,
        element.offsetHeight - window.innerHeight,
      );
      trigger.getTween()?.progress(1);
      tween.progress(value);
      draw();
    };
    const restore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(synchronize);
    };
    const resize = () => {
      const viewport = `${window.innerWidth}:${window.innerHeight}`;
      if (viewport === oldViewport) return;
      const position = normalizedScroll(
        window.scrollY - element.offsetTop,
        oldDistance,
      );
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        oldDistance = element.offsetHeight - window.innerHeight;
        oldViewport = viewport;
        trigger.refresh();
        window.scrollTo({
          top: element.offsetTop + position * oldDistance,
          behavior: "auto",
        });
        synchronize();
      }, 140);
    };
    window.addEventListener("pageshow", restore);
    window.addEventListener("popstate", restore);
    window.addEventListener("resize", resize);
    restore();
    return () => {
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("resize", resize);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(frame);
      trigger.kill();
      tween.kill();
      panels.forEach((panel) => {
        panel.removeAttribute("style");
        panel.removeAttribute("aria-hidden");
        panel.inert = false;
      });
    };
  }, [root, progress, reducedMotion]);
}
