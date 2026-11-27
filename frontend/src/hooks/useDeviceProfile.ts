import { useEffect, useState } from 'react';
import {
  applyDeviceProfileToDom,
  detectDeviceProfile,
  type DeviceProfile,
} from '../core/deviceProfile';
import { useStore } from '../store/useStore';

/** Subscribe to viewport + appearance.density; apply CSS tokens. */
export function useDeviceProfile(): DeviceProfile {
  const densityPref = useStore((s) => s.appearance.density ?? 'auto');
  const [profile, setProfile] = useState(() =>
    detectDeviceProfile(undefined, undefined, densityPref)
  );

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = detectDeviceProfile(undefined, undefined, densityPref);
        setProfile(next);
        applyDeviceProfileToDom(next);
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqPointer = window.matchMedia('(pointer: coarse)');
    mqMotion.addEventListener?.('change', update);
    mqPointer.addEventListener?.('change', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      mqMotion.removeEventListener?.('change', update);
      mqPointer.removeEventListener?.('change', update);
    };
  }, [densityPref]);

  return profile;
}
