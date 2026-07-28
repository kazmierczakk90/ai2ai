import type { SVGProps } from "react";

export function Stairs(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h4v-4h4v-4h4V8h4V4" />
    </svg>
  );
}
