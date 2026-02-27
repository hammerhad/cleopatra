import { create } from 'zustand';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

interface UIState {
  toasts: Toast[];
  isPaywallVisible: boolean;
  paywallTrigger: string | null;
  showToast: (message: string, type?: Toast['type']) => void;
  hideToast: (id: string) => void;
  showPaywall: (trigger?: string) => void;
  hidePaywall: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isPaywallVisible: false,
  paywallTrigger: null,

  showToast: (message, type = 'info') => {
    const id = String(++toastId);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },

  hideToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  showPaywall: (trigger) =>
    set({ isPaywallVisible: true, paywallTrigger: trigger ?? null }),

  hidePaywall: () =>
    set({ isPaywallVisible: false, paywallTrigger: null }),
}));
