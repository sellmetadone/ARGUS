/**
 * Device profile + density — breakpoints from core/breakpoints.ts
 */
import { BREAKPOINTS, type BreakpointName } from './breakpoints';

export type DeviceClass = BreakpointName;
export type Density = 'comfortable' | 'compact' | 'spacious';

export type DeviceProfile = {
  class: DeviceClass;
  density: Density;
  width: number;
  height: number;
  dpr: number;
  coarsePointer: boolean;
  reduceMotion: boolean;
  onlyRenderVisible: boolean;
  showMinimap: boolean;
  uiScale: number;
  sidebarWidth: number;
  inspectorWidth: number;
  compactToolbar: boolean;
  maxAnimatedEdges: number;
  positionFlushMs: number;
  touchTarget: number;
  /** true when height is limited */
  shortViewport: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function densityFromViewport(deviceClass: DeviceClass, w: number, h: number): Density {
  if (deviceClass === 'phone' || deviceClass === 'tablet') return 'compact';
  if (deviceClass === 'laptop' && h < BREAKPOINTS.shortHeight) return 'compact';
  if (deviceClass === 'desktop' || deviceClass === 'ultrawide') return 'spacious';
  return 'comfortable';
}

export function detectDeviceProfile(
  w = typeof window !== 'undefined' ? window.innerWidth : 1440,
  h = typeof window !== 'undefined' ? window.innerHeight : 900,
  densityOverride?: 'auto' | Density | null
): DeviceProfile {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const coarsePointer =
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false;
  const reduceMotion =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  let deviceClass: DeviceClass;
  if (w <= BREAKPOINTS.phone) deviceClass = 'phone';
  else if (w < BREAKPOINTS.laptop) deviceClass = 'tablet';
  else if (w < BREAKPOINTS.desktop) deviceClass = 'laptop';
  else if (w < BREAKPOINTS.ultrawide) deviceClass = 'desktop';
  else deviceClass = 'ultrawide';

  let density: Density = densityFromViewport(deviceClass, w, h);
  if (densityOverride && densityOverride !== 'auto') density = densityOverride;

  let uiScale = 1;
  if (deviceClass === 'ultrawide' && w >= 2560) uiScale = 1.05;
  if (density === 'compact') uiScale = Math.min(uiScale, 0.95);
  if (density === 'spacious') uiScale = Math.max(uiScale, 1.02);

  const sidebarBase =
    deviceClass === 'phone' ? 0 : deviceClass === 'tablet' ? 220 : deviceClass === 'laptop' ? 260 : 280;
  const inspectorBase =
    deviceClass === 'phone' ? 0 : deviceClass === 'tablet' ? 280 : deviceClass === 'laptop' ? 320 : 360;

  const densitySidebar = density === 'compact' ? -20 : density === 'spacious' ? 16 : 0;
  const densityInspector = density === 'compact' ? -24 : density === 'spacious' ? 20 : 0;

  const sidebarWidth = deviceClass === 'phone' ? 0 : clamp(sidebarBase + densitySidebar, 200, 320);
  const inspectorWidth = deviceClass === 'phone' ? 0 : clamp(inspectorBase + densityInspector, 260, 420);

  const pixelBudget = w * h * dpr;
  const onlyRenderVisible =
    deviceClass === 'phone' || deviceClass === 'tablet' || deviceClass === 'laptop' || pixelBudget > 1_200_000;

  const maxAnimatedEdges =
    reduceMotion || deviceClass === 'phone' ? 0 : deviceClass === 'tablet' ? 12 : deviceClass === 'laptop' ? 40 : 80;

  const shortViewport = h < BREAKPOINTS.shortHeight;

  return {
    class: deviceClass,
    density,
    width: w,
    height: h,
    dpr: clamp(dpr, 1, 3),
    coarsePointer,
    reduceMotion,
    onlyRenderVisible,
    showMinimap:
      deviceClass === 'desktop' || deviceClass === 'ultrawide' || (deviceClass === 'laptop' && w >= 1366),
    uiScale,
    sidebarWidth,
    inspectorWidth,
    compactToolbar: w < BREAKPOINTS.compactToolbar || density === 'compact',
    maxAnimatedEdges,
    positionFlushMs: deviceClass === 'phone' || coarsePointer ? 120 : 80,
    touchTarget: density === 'compact' ? 32 : density === 'spacious' ? 44 : 36,
    shortViewport,
  };
}

export function applyDeviceProfileToDom(profile: DeviceProfile) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-device', profile.class);
  root.setAttribute('data-density', profile.density);
  root.setAttribute('data-short', profile.shortViewport ? 'true' : 'false');
  root.style.setProperty('--sidebar-w', `${profile.sidebarWidth}px`);
  root.style.setProperty('--inspector-w', `${profile.inspectorWidth}px`);
  root.style.setProperty('--ui-scale', String(profile.uiScale));
  root.style.setProperty('--bp-phone', `${BREAKPOINTS.phone}px`);
  root.style.setProperty('--bp-tablet', `${BREAKPOINTS.tablet}px`);
  root.style.setProperty('--bp-laptop', `${BREAKPOINTS.laptop}px`);
  root.style.setProperty('--bp-desktop', `${BREAKPOINTS.desktop}px`);
  root.style.setProperty('--bp-ultrawide', `${BREAKPOINTS.ultrawide}px`);

  if (profile.density === 'compact') {
    root.style.setProperty('--ui-pad', '8px');
    root.style.setProperty('--panel-gap', '4px');
    root.style.setProperty('--topbar-h', '48px');
    root.style.setProperty('--footer-h', '24px');
    root.style.setProperty('--control-h', '32px');
    root.style.setProperty('--control-h-lg', '36px');
  } else if (profile.density === 'spacious') {
    root.style.setProperty('--ui-pad', '16px');
    root.style.setProperty('--panel-gap', '12px');
    root.style.setProperty('--topbar-h', '64px');
    root.style.setProperty('--footer-h', '32px');
    root.style.setProperty('--control-h', '40px');
    root.style.setProperty('--control-h-lg', '48px');
  } else {
    root.style.setProperty('--ui-pad', '12px');
    root.style.setProperty('--panel-gap', '8px');
    root.style.setProperty('--topbar-h', '56px');
    root.style.setProperty('--footer-h', '28px');
    root.style.setProperty('--control-h', '36px');
    root.style.setProperty('--control-h-lg', '40px');
  }
  root.style.setProperty('--touch-target', `${profile.touchTarget}px`);
  if (profile.reduceMotion) root.setAttribute('data-reduce-motion', 'true');
  else root.removeAttribute('data-reduce-motion');
}
