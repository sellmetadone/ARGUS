/**
 * Desktop / laptop first device profile.
 * Phones get a usable fallback; primary tuning is 13–27" screens.
 */

export type DeviceClass = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
export type Density = 'comfortable' | 'compact' | 'spacious';

export type DeviceProfile = {
  class: DeviceClass;
  density: Density;
  width: number;
  height: number;
  dpr: number;
  coarsePointer: boolean;
  reduceMotion: boolean;
  /** Suggested canvas onlyRenderVisibleElements */
  onlyRenderVisible: boolean;
  /** Minimap on by default for larger screens */
  showMinimap: boolean;
  /** Suggested UI scale (1 = 100%) */
  uiScale: number;
  /** Sidebar width px */
  sidebarWidth: number;
  /** Inspector width px */
  inspectorWidth: number;
  /** Collapse secondary toolbar labels under this width */
  compactToolbar: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function detectDeviceProfile(
  w = typeof window !== 'undefined' ? window.innerWidth : 1440,
  h = typeof window !== 'undefined' ? window.innerHeight : 900
): DeviceProfile {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const coarsePointer =
    typeof window !== 'undefined'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;
  const reduceMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  let deviceClass: DeviceClass;
  if (w < 720) deviceClass = 'phone';
  else if (w < 1024) deviceClass = 'tablet';
  else if (w < 1440) deviceClass = 'laptop';
  else if (w < 1920) deviceClass = 'desktop';
  else deviceClass = 'ultrawide';

  // Density: roomy on large monitors, compact on 13–15" laptops
  let density: Density = 'comfortable';
  if (deviceClass === 'laptop' && h < 900) density = 'compact';
  if (deviceClass === 'desktop' || deviceClass === 'ultrawide') density = 'spacious';
  if (deviceClass === 'phone' || deviceClass === 'tablet') density = 'compact';

  // Scale: slight bump on high-DPI laptop panels, never aggressive zoom via body
  let uiScale = 1;
  if (deviceClass === 'laptop' && dpr >= 1.5 && w >= 1280) uiScale = 1;
  if (deviceClass === 'ultrawide' && w >= 2560) uiScale = 1.05;
  if (deviceClass === 'phone') uiScale = 1;

  const sidebarWidth =
    deviceClass === 'phone' ? 0 : deviceClass === 'tablet' ? 220 : deviceClass === 'laptop' ? 260 : 280;
  const inspectorWidth =
    deviceClass === 'phone' ? 0 : deviceClass === 'tablet' ? 280 : deviceClass === 'laptop' ? 320 : 360;

  return {
    class: deviceClass,
    density,
    width: w,
    height: h,
    dpr: clamp(dpr, 1, 3),
    coarsePointer,
    reduceMotion,
    onlyRenderVisible: deviceClass === 'laptop' || deviceClass === 'desktop' || w * h > 1_200_000,
    showMinimap: deviceClass === 'desktop' || deviceClass === 'ultrawide' || (deviceClass === 'laptop' && w >= 1366),
    uiScale,
    sidebarWidth,
    inspectorWidth,
    compactToolbar: w < 1280,
  };
}

export function applyDeviceProfileToDom(profile: DeviceProfile) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-device', profile.class);
  root.setAttribute('data-density', profile.density);
  root.style.setProperty('--sidebar-w', `${profile.sidebarWidth}px`);
  root.style.setProperty('--inspector-w', `${profile.inspectorWidth}px`);
  root.style.setProperty('--ui-pad', profile.density === 'compact' ? '8px' : profile.density === 'spacious' ? '16px' : '12px');
  root.style.setProperty('--panel-gap', profile.density === 'compact' ? '4px' : '8px');
  if (profile.reduceMotion) {
    root.setAttribute('data-reduce-motion', 'true');
  } else {
    root.removeAttribute('data-reduce-motion');
  }
}
