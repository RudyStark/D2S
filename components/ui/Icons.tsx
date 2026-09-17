import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export const ArrowRight = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 12h15m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Play = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.8l10.3-7.2a1 1 0 0 0 0-1.6L8.6 4c-.7-.5-1.6 0-1.6.8Z" fill="currentColor" />
  </svg>
);

export const Sparkle = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M11 3.5c.5 3.8 2.7 6 6.5 6.5-3.8.5-6 2.7-6.5 6.5-.5-3.8-2.7-6-6.5-6.5 3.8-.5 6-2.7 6.5-6.5Z" fill="currentColor" />
    <path d="M18.5 14.5c.2 1.6 1.2 2.6 2.8 2.8-1.6.2-2.6 1.2-2.8 2.8-.2-1.6-1.2-2.6-2.8-2.8 1.6-.2 2.6-1.2 2.8-2.8Z" fill="currentColor" />
  </svg>
);

export const Globe = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const ChevronDown = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronRight = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Search = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Bolt = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M13.2 2.5 5.5 13.1c-.4.5 0 1.2.6 1.2H11l-1.2 7.2 7.7-10.6c.4-.5 0-1.2-.6-1.2H12l1.2-7.2Z" fill="currentColor" />
  </svg>
);

export const People = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="9" cy="8" r="3.4" fill="currentColor" />
    <circle cx="17" cy="9" r="2.6" fill="currentColor" />
    <path d="M2.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6v.5h-13V19Z" fill="currentColor" />
    <path d="M16.5 19.5V19c0-1.8-.6-3.3-1.7-4.4.7-.4 1.5-.6 2.4-.6 2.6 0 4.3 1.9 4.3 4.6v.9h-5Z" fill="currentColor" />
  </svg>
);

export const Bars = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="4" y="13" width="4" height="7" rx="1" fill="currentColor" />
    <rect x="10" y="9" width="4" height="11" rx="1" fill="currentColor" />
    <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" />
  </svg>
);
