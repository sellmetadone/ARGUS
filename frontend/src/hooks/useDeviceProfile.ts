import { useEffect, useState } from 'react';
import {
  applyDeviceProfileToDom,
  detectDeviceProfile,
  type DeviceProfile,
} from '../core/deviceProfile';

/** Subscribe to viewport + media; apply desktop-first CSS tokens. */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState(() => detectDeviceProfile());

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = detectDeviceProfile();
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
  }, []);

  return profile;
}
