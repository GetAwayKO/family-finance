import "./_logo.scss";

/** Знак: монета, внутри которой течёт поток — две волны. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cf-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1fa37a" />
          <stop offset="1" stopColor="#0b5a43" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#cf-logo-bg)" />
      <circle
        cx="20"
        cy="20"
        r="14.5"
        fill="none"
        stroke="#f2b544"
        strokeWidth="1.6"
      />
      <path
        d="M11.5 17.5q4.25-4 8.5 0t8.5 0M11.5 24q4.25-4 8.5 0t8.5 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps {
  /** Название для скринридеров. */
  label: string;
  size?: number;
}

/** Знак и словесная часть логотипа. */
export default function Logo({ label, size }: LogoProps) {
  return (
    <span className="logo" role="img" aria-label={label}>
      <LogoMark size={size} />
      <span className="logo__text" aria-hidden="true">
        Cash<span className="logo__accent">Flow</span>
      </span>
    </span>
  );
}
