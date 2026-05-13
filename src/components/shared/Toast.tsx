'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

/**
 * ToastProvider — Renderizar una vez en el layout raíz
 */
export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: "'Inter', sans-serif",
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
        },
      }}
      closeButton
      richColors
    />
  );
}

/** Helpers de notificación */
export const showToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  warning: (msg: string) => toast.warning(msg),
  info: (msg: string) => toast.info(msg),
  loading: (msg: string) => toast.loading(msg),
};
