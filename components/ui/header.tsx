import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { ScienceDialog } from "./science-dialog";

export function Header({ explorer = false }: { explorer?: boolean }) {
  return (
    <header className={`site-header ${explorer ? "explorer-header" : ""}`}>
      <Brand />
      <nav className="main-nav" aria-label="Main navigation">
        <Link
          href="/"
          className={`nav-link expedition-nav ${!explorer ? "active" : ""}`}
          aria-current={!explorer ? "page" : undefined}
        >
          The expedition
        </Link>
        <ScienceDialog />
        <Link
          href="/explore"
          className={`nav-link explorer-nav ${explorer ? "active" : ""}`}
          aria-current={explorer ? "page" : undefined}
        >
          Ocean explorer
        </Link>
      </nav>
      <Link href={explorer ? "/" : "/explore"} className="header-cta">
        {explorer ? "Back to expedition" : "Launch explorer"}
        <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
