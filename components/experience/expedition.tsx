"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Orbit,
} from "lucide-react";
import { useCallback, useRef } from "react";
import { Header } from "@/components/ui/header";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useExpeditionScroll } from "@/lib/hooks/use-expedition-scroll";
import {
  CHAPTERS,
  DEPTH_MARKS,
  depthGaugePosition,
} from "@/lib/animation/journey";

const ExperienceCanvas = dynamic(() => import("./experience-canvas"), {
  ssr: false,
  loading: () => null,
});

export function Expedition() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef({ value: 0 });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 760px)");

  useExpeditionScroll(root, progress, reducedMotion);
  const rendererStatus = useCallback((ready: boolean) => {
    if (root.current)
      root.current.dataset.renderer = ready ? "ready" : "fallback";
  }, []);

  function goToChapter(index: number) {
    if (!root.current) return;
    if (reducedMotion) {
      root.current
        .querySelectorAll(".story-panel")
        [CHAPTERS[index].panel]?.scrollIntoView({ behavior: "auto" });
      return;
    }
    const distance = root.current.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: root.current.offsetTop + distance * CHAPTERS[index].landing,
      behavior: "smooth",
    });
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        ref={root}
        className={`expedition ${reducedMotion ? "reduced-experience" : ""}`}
      >
        <div className="cinematic-viewport">
          <div className="space-fallback" aria-hidden="true">
            <div className="fallback-earth" />
          </div>
          {!reducedMotion && (
            <ExperienceCanvas
              progress={progress}
              mobile={mobile}
              onAvailability={rendererStatus}
            />
          )}
          <div className="scene-shade" aria-hidden="true" />
          <div className="ocean-fallback" aria-hidden="true" />
          <div className="frame-corner top-left" aria-hidden="true" />
          <div className="frame-corner bottom-right" aria-hidden="true" />

          

          <section
            className="story-panel opening-panel"
            aria-label="Orbital perspective"
          >
            <div className="hero-copy">
              <span className="eyebrow accent">BEYOND WHAT WE CAN SEE</span>
              <h1>
                The surface is
                <br />
                only the
                <br />
                <span className="light-word">beginning.</span>
              </h1>
              <p>
                A journey from satellite observations
                <br className="desktop-break" /> to the hidden depths of our
                ocean.
              </p>
              <button className="journey-button" onClick={() => goToChapter(1)}>
                <span className="round-arrow">
                  <ArrowDown size={19} />
                </span>
                <span>
                  Begin the descent<small>SCROLL TO DISCOVER</small>
                </span>
              </button>
            </div>
            <div className="planet-annotation">
              <span className="annotation-cross">+</span>
              <span className="eyebrow">A WORLD BENEATH</span>
              <span className="mono">15 depths. One connected ocean.</span>
            </div>
            <div className="orbital-tag">
              <Orbit size={15} />
              <span className="mono">SURFACE OBSERVATION</span>
              <span className="signal-bars">
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
          </section>

          <section
            className="story-panel approach-panel"
          >
            <span className="eyebrow accent">01 / ORBIT TO OCEAN</span>
            <h2>
              A different
              <br />
              kind of blue.
            </h2>
            <p>
              From above, a continuous view.
              <br />
              Below, a world of unanswered questions.
            </p>
            <span className="coordinate-label mono">
              EARTH · INDIAN OCEAN HEMISPHERE
            </span>
          </section>

          <section className="story-panel region-panel">
            <span className="eyebrow accent">02 / OUR FIELD OF VIEW</span>
            <h2>
              North
              <br />
              Indian Ocean.
            </h2>
            <p>
              One connected ocean.
              <br />
              Fifteen layers of understanding.
            </p>
            <div className="region-detail mono">
              <span>
                0.25°<small>TARGET GRID</small>
              </span>
              <span>
                24 h<small>TARGET CADENCE</small>
              </span>
              <span>
                1000 m<small>DEEPEST QUERY</small>
              </span>
            </div>
          </section>

          <section className="story-panel surface-panel">
            <span className="eyebrow accent">03 / THE VISIBLE WORLD</span>
            <h2>
              Satellites reveal
              <br />
              the surface.
            </h2>
            <p>Every observation is part of a larger story.</p>
            <div className="surface-variables" role="list" aria-label="Satellite-observed surface variables">
              <span role="listitem">
                <b>SST</b>Sea surface temperature
                <small>°C · thermal field</small>
              </span>
              <span role="listitem">
                <b>SSS</b>Sea surface salinity
                <small>psu · freshwater flux</small>
              </span>
              <span role="listitem">
                <b>SLA</b>Sea level anomaly
                <small>cm · dynamic height</small>
              </span>
              <span role="listitem">
                <b>U / V</b>Ocean currents
                <small>m/s · vector flow</small>
              </span>
              <span role="listitem">
                <b>Uᴡ / Vᴡ</b>Surface winds
                <small>m/s · wind stress</small>
              </span>
            </div>
            <div className="surface-flow" aria-hidden="true">
              <span className="flow-line" />
              <span className="flow-line flow-line-2" />
              <span className="flow-line flow-line-3" />
            </div>
          </section>

          <section className="story-panel underwater-panel">
            <span className="eyebrow accent">04 / BENEATH THE SURFACE</span>
            <h2>
              Sunlight fades.
              <br />
              <span className="light-word">The questions deepen.</span>
            </h2>
            <p>
              Surface observations reveal less
              <br />
              about the layers below.
            </p>
            <span className="mono static-depth">≈ 50–200 M · SUNLIT ZONE</span>
          </section>

          <section className="story-panel deep-panel">
            <span className="eyebrow accent">05 / THE OBSERVATION GAP</span>
            <h2>
              Out of sight.
              <br />
              Not out of reach.
            </h2>
            <p>
              Satellites cannot directly measure temperature here.
              <br />
              How much can the surface tell us about the ocean below?
            </p>
            <span className="mono static-depth">≈ 300–700 M · TWILIGHT ZONE</span>
          </section>

          <section className="story-panel question-panel">
            <span className="eyebrow">1,000 METRES BELOW THE SURFACE</span>
            <h2>
              But what
              <br />
              <em>lies beneath?</em>
            </h2>
            <div className="quiet-line" />
          </section>

          <section className="story-panel reveal-panel">
            <span className="eyebrow accent">
              INTRODUCING DEPTH-WISE OBSERVABILITY-AWARE RECONSTRUCTION
            </span>
            <h2>
              OCEANEMBED<span>-X</span>
            </h2>
            <p className="reveal-subtitle">Reconstructing the unseen ocean.</p>
            <div className="reveal-outputs">
              <span>
                <b>T̂(z)</b>Temperature
              </span>
              <span>
                <b>O(z)</b>Observability
              </span>
              <span>
                <b>σ(z)</b>Uncertainty
              </span>
            </div>
            <Link href="/explore" className="primary-button">
              Explore beneath the surface <ArrowUpRight size={18} />
            </Link>
            <span className="reveal-note mono">
              15 DEPTHS · THREE PERSPECTIVES · ONE OCEAN
            </span>
          </section>

          <aside
            className="depth-gauge"
            aria-label="Depth below the ocean surface"
          >
            <span className="eyebrow">DEPTH</span>
            <strong>
              <span data-depth>0</span>
              <small>m</small>
            </strong>
            <div className="depth-ruler" aria-hidden="true">
              <div className="depth-fill" />
              {DEPTH_MARKS.map((depth) => (
                <span
                  key={depth}
                  style={{ top: `${depthGaugePosition(depth) * 100}%` }}
                >
                  <i />
                  {depth}
                </span>
              ))}
            </div>
            <span className="depth-zone mono" data-zone>
              SUNLIT ZONE
            </span>
            <span className="sr-only" data-depth-status role="status" aria-live="polite" />
            <span className="wildlife-note">Marine life is illustrative.</span>
          </aside>

          
        </div>
      </main>
    </>
  );
}
