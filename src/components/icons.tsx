import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const Icons = {
  dashboard: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
  ),
  journal: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h6" /></svg>
  ),
  news: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h6" /></svg>
  ),
  coach: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></svg>
  ),
  card: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
  ),
  user: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  shield: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
  ),
  logout: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" /></svg>
  ),
  upload: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
  ),
  chart: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 6-7" /></svg>
  ),
  phone: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></svg>
  ),
  bolt: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
  ),
};
export type IconName = keyof typeof Icons;
