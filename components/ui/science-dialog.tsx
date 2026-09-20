"use client";

import { useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";

export function ScienceDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="nav-link"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        The science
      </button>
      <dialog
        ref={dialog}
        className="science-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        aria-labelledby="science-title"
      >
        <div className="dialog-content">
          <button
            className="icon-button dialog-close"
            aria-label="Close the science dialog"
            onClick={() => dialog.current?.close()}
          >
            <X size={21} />
          </button>
          <span className="eyebrow accent">
            BEYOND THE SURFACE / THE SCIENCE
          </span>
          <h2 id="science-title">
            An ocean of data.
            <br />A deeper understanding.
          </h2>
          <p>
            Satellites continuously observe the surface. The ocean beneath is
            sampled far more sparsely by Argo floats and other in-situ systems.
          </p>
          <p>
            OceanEmbed-X proposes{" "}
            <strong>
              Depth-wise Observability-Aware Reconstruction (DOAR)
            </strong>
            : a framework that asks both what the temperature could be and how
            strongly surface observations can constrain it.
          </p>
          <div className="science-outputs">
            <div>
              <span>T̂(z)</span>
              <strong>Temperature</strong>
              <p>Reconstructed thermal structure at depth.</p>
            </div>
            <div>
              <span>O(z)</span>
              <strong>Observability</strong>
              <p>The information available from the surface.</p>
            </div>
            <div>
              <span>σ(z)</span>
              <strong>Uncertainty</strong>
              <p>Predictive uncertainty at each depth.</p>
            </div>
          </div>
          <p>
            The proposed workflow encodes seven days of SST, SSS, SLA/SSH,
            currents, and winds into an ocean-state embedding. A depth-adaptive
            decoder uses depth queries and a vertical prior to produce daily
            0.25° fields at 15 levels, from 0 to 1000 m.
          </p>
          <p className="science-note">
            This frontend uses deterministic synthetic data. It does not run a
            trained model or report validated predictions. OceanEmbed-X
            complements direct observations; it does not replace Argo.
          </p>
          <a
            href="/OceanEmbed-X.pdf"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Read the project proposal <ArrowUpRight size={17} />
          </a>
          <span className="dialog-credit mono">
            NEUTRONS · SIH 2026 · SIH26066
          </span>
        </div>
      </dialog>
    </>
  );
}
