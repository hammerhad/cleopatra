import { create } from 'zustand';
import type { CycleSettings, CyclePrediction } from '../types/cycle';

interface CycleState {
  settings: CycleSettings | null;
  prediction: CyclePrediction | null;
  isLoading: boolean;
  privacyLocked: boolean;
  setSettings: (settings: CycleSettings | null) => void;
  setPrediction: (prediction: CyclePrediction | null) => void;
  setLoading: (loading: boolean) => void;
  setPrivacyLocked: (locked: boolean) => void;
}

export const useCycleStore = create<CycleState>((set) => ({
  settings: null,
  prediction: null,
  isLoading: true,
  privacyLocked: false,

  setSettings: (settings) => set({ settings, isLoading: false }),
  setPrediction: (prediction) => set({ prediction }),
  setLoading: (isLoading) => set({ isLoading }),
  setPrivacyLocked: (privacyLocked) => set({ privacyLocked }),
}));
