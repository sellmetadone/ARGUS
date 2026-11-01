import { create } from 'zustand';

export type TemporalFilterState = {
  enabled: boolean;
  from: string;
  to: string;
  /** When false, entities without any dates are hidden in range mode */
  keepUndated: boolean;
  setEnabled: (v: boolean) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setKeepUndated: (v: boolean) => void;
  setRange: (from: string, to: string) => void;
  clear: () => void;
};

export const useTemporalFilter = create<TemporalFilterState>((set) => ({
  enabled: false,
  from: '',
  to: '',
  keepUndated: true,
  setEnabled: (v) => set({ enabled: v }),
  setFrom: (v) => set({ from: v, enabled: !!(v || useTemporalFilter.getState().to) }),
  setTo: (v) => set({ to: v, enabled: !!(v || useTemporalFilter.getState().from) }),
  setKeepUndated: (v) => set({ keepUndated: v }),
  setRange: (from, to) => set({ from, to, enabled: !!(from || to) }),
  clear: () => set({ from: '', to: '', enabled: false }),
}));
