/**
 * ARGUS adaptive breakpoints — single source of truth.
 * Keep in sync with detectDeviceProfile() width thresholds.
 */
export const BREAKPOINTS = {
  /** max phone */
  phone: 719,
  /** min tablet */
  tablet: 720,
  /** min laptop */
  laptop: 1024,
  /** min desktop */
  desktop: 1440,
  /** min ultrawide */
  ultrawide: 1920,
  /** toolbar labels collapse below */
  compactToolbar: 1280,
  /** short viewport height → prefer compact density hints */
  shortHeight: 900,
} as const;

export type BreakpointName = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';

export function breakpointFromWidth(w: number): BreakpointName {
  if (w <= BREAKPOINTS.phone) return 'phone';
  if (w < BREAKPOINTS.laptop) return 'tablet';
  if (w < BREAKPOINTS.desktop) return 'laptop';
  if (w < BREAKPOINTS.ultrawide) return 'desktop';
  return 'ultrawide';
}

/** CSS media helpers for docs / runtime checks */
export const MEDIA = {
  phone: `(max-width: ${BREAKPOINTS.phone}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.laptop - 1}px)`,
  laptop: `(min-width: ${BREAKPOINTS.laptop}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px) and (max-width: ${BREAKPOINTS.ultrawide - 1}px)`,
  ultrawide: `(min-width: ${BREAKPOINTS.ultrawide}px)`,
  compactToolbar: `(max-width: ${BREAKPOINTS.compactToolbar - 1}px)`,
  shortHeight: `(max-height: ${BREAKPOINTS.shortHeight - 1}px)`,
  coarse: '(pointer: coarse)',
  fine: '(pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;
