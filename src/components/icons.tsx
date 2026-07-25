// Minimal Lucide-style icon set (1.75px stroke, 24px grid, round caps).
// Replaces the emoji scattered through the UI so the dashboard reads as a
// clean, professional product rather than a toy.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />
  </Base>
);

export const PauseIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="7" y="5.5" width="3.2" height="13" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.8" y="5.5" width="3.2" height="13" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const ResetIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
  </Base>
);

export const SkipIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 5.5v13l9-6.5-9-6.5Z" fill="currentColor" stroke="none" />
    <path d="M18 5.5v13" />
  </Base>
);

export const SunIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Base>
);

export const MoonIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Base>
);

export const VolumeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 9.5h3l4-3.5v12l-4-3.5H4Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6" />
    <path d="M18 6.5a8 8 0 0 1 0 11" />
  </Base>
);

export const ChevronIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const CoffeeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
    <path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2" />
    <path d="M8 3.5v1.5M11.5 3.5v1.5" />
  </Base>
);

export const TrophyIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5v1a3 3 0 0 0 3 3M16 5h3v1a3 3 0 0 1-3 3" />
    <path d="M12 12v3M9 19h6M10 19v-2h4v2" />
  </Base>
);

export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Base>
);

// Brand mark — an abstract "focus arc + break dot", no cartoon cat.
export const BrandMark = ({ size = 20, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
    <path
      d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
    />
    <circle cx="18.5" cy="6" r="2.25" fill="currentColor" />
  </svg>
);
