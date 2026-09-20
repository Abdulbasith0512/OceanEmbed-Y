"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="not-found">
      <span className="eyebrow accent">SIGNAL INTERRUPTED</span>
      <h1>Let’s reconnect.</h1>
      <p>The experience couldn’t load. Please try again.</p>
      <button className="primary-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
