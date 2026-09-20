import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="OceanEmbed-X home">
      <svg
        width="35"
        height="35"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 16C10 6 17 6 23 16C29 26 34 26 38 20M2 22C8 12 15 12 21 22C27 32 33 32 38 24"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M20 2V9M20 31V38M2 20H8M32 20H39"
          stroke="currentColor"
          strokeOpacity=".5"
        />
      </svg>
      <span>
        OCEANEMBED<span className="brand-x">-X</span>
      </span>
    </Link>
  );
}
