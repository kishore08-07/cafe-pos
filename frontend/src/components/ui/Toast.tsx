import { create } from 'zustand';
import { useEffect } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const borderColors: Record<ToastVariant, string> = {
  success: '#4A7C59',
  error: '#8B3A3A',
  info: '#00754A',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-0 right-0 left-0 sm:left-auto z-[200] flex flex-col items-stretch sm:items-end p-3 gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItemView key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItemView({
  toast,
  dismiss,
}: {
  toast: ToastItem;
  dismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 3000);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);
  return (
    <div
      className="pointer-events-auto sm:w-80 bg-surface border border-border px-4 py-3 flex items-center justify-between gap-3"
      style={{
        borderLeft: `2px solid ${borderColors[toast.variant]}`,
        borderRadius: '2px',
      }}
    >
      <span className="text-[17px] font-light text-text">
        {toast.message}
      </span>
      <button
        onClick={() => dismiss(toast.id)}
        className="text-text-faint hover:text-gold text-[15px] uppercase tracking-[0.12em]"
      >
        Dismiss
      </button>
    </div>
  );
}

export const toast = {
  success: (m: string) => useToastStore.getState().push(m, 'success'),
  error: (m: string) => useToastStore.getState().push(m, 'error'),
  info: (m: string) => useToastStore.getState().push(m, 'info'),
};
