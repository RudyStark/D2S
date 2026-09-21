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

export const Gear = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.3 2.5h3.4l.5 2.6c.7.3 1.4.7 2 1.2l2.5-.9 1.7 2.9-2 1.7c.1.7.1 1.5 0 2.2l2 1.7-1.7 2.9-2.5-.9c-.6.5-1.3.9-2 1.2l-.5 2.6h-3.4l-.5-2.6c-.7-.3-1.4-.7-2-1.2l-2.5.9-1.7-2.9 2-1.7a6.6 6.6 0 0 1 0-2.2l-2-1.7 1.7-2.9 2.5.9c.6-.5 1.3-.9 2-1.2l.5-2.6ZM12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"
      fill="currentColor"
    />
  </svg>
);

export const Chat = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-4.4 3.6c-.6.5-1.6 0-1.6-.8V5.5Z" fill="currentColor" />
    <path d="M8 8.5h8M8 12h5.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const ChatDots = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M3.5 6A2.5 2.5 0 0 1 6 3.5h12A2.5 2.5 0 0 1 20.5 6v8.5A2.5 2.5 0 0 1 18 17h-6.5l-4.3 3.4c-.6.5-1.5 0-1.5-.8V17H6a2.5 2.5 0 0 1-2.5-2.5V6Z" fill="currentColor" />
    <circle cx="8.5" cy="10.3" r="1.3" fill="#fff" />
    <circle cx="12" cy="10.3" r="1.3" fill="#fff" />
    <circle cx="15.5" cy="10.3" r="1.3" fill="#fff" />
  </svg>
);

export const PlayBox = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" fill="currentColor" />
    <path d="M10 9.2v5.6c0 .5.5.8.9.5l4.3-2.8a.6.6 0 0 0 0-1L10.9 8.7c-.4-.3-.9 0-.9.5Z" fill="#fff" />
  </svg>
);

export const Doc = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M6.5 3h7.2L19 8.3v11.2A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M13.5 3.2V8.5H18.8M8.5 12.5h7M8.5 16h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Rocket = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M20.5 3.5c-4.8-.3-8.7 1.9-11.3 6.1L6 9.9 3.5 13l3.8 1 2.7 2.7 1 3.8 3.1-2.5.3-3.2c4.2-2.6 6.4-6.5 6.1-11.3Z" fill="currentColor" />
    <circle cx="15.3" cy="8.7" r="1.8" fill="#fff" />
    <path d="M6.5 17.5c-1.6.3-2.6 1.3-3 3 1.7-.4 2.7-1.4 3-3Z" fill="currentColor" />
  </svg>
);

export const Clock = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Smile = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.3 13.8c.9 1.3 2.2 2 3.7 2s2.8-.7 3.7-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9.2" cy="9.8" r="1.1" fill="currentColor" />
    <circle cx="14.8" cy="9.8" r="1.1" fill="currentColor" />
  </svg>
);

export const Users = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="9" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 19.5c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M15.5 5.2a3.1 3.1 0 0 1 0 5.9M17.5 14.3c2 .6 3.5 2.4 3.5 4.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const Mail = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Calendar = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="7" y="13" width="3" height="3" rx="0.8" fill="currentColor" />
  </svg>
);

export const Plug = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M9 3v4.5M15 3v4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M6.5 7.5h11v3.5a5.5 5.5 0 0 1-11 0V7.5Z" fill="currentColor" />
    <path d="M12 16.5V21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const CodeOff = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 19.5 19.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const TrendUp = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m3.5 16.5 6-6 4 4 7-7.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.5 7h5v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Check = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ContactCard = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="9" cy="11" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5.8 16.3c.6-1.5 1.8-2.3 3.2-2.3s2.6.8 3.2 2.3M14.5 10h3.5M14.5 13.5h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const Close = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const ChevronLeft = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Shield = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.2 7 9.8 4.1-1.6 7-5.5 7-9.8V5.8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m9 12 2.2 2.2L15.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Target = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
  </svg>
);

export const Replay = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M4.5 4.5v3.8h3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpRight = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M7 17 17 7m0 0H9m8 0v8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Star = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.6l5.8-.8L12 3.5Z" fill="currentColor" />
  </svg>
);

export const Alert = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M10.3 4.2 2.9 17.3A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.7L13.7 4.2a2 2 0 0 0-3.4 0Z" fill="currentColor" />
    <path d="M12 9v4.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="12" cy="16.6" r="1.1" fill="#fff" />
  </svg>
);

export const Package = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m4 7 8 4 8-4M12 11v10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
