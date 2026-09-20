import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <span className="eyebrow accent">404 / UNCHARTED WATERS</span>
      <h1>A little off course.</h1>
      <p>This location isn’t on our map. Let’s return to the surface.</p>
      <Link href="/" className="primary-button">
        <ArrowLeft size={17} /> Back to the expedition
      </Link>
    </main>
  );
}
