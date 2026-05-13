'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    button: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
    border: 'border-[#DC2626]/20',
    icon: '⚠️',
  },
  warning: {
    button: 'bg-[#E8571A] hover:bg-[#C44D16] text-white',
    border: 'border-[#E8571A]/20',
    icon: '⚡',
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };

    document.addEventListener('keydown', handleKey);
    confirmRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onConfirm, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_200ms_ease]"
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className={`relative bg-white rounded-2xl shadow-xl border ${styles.border} p-6 w-full max-w-sm mx-4 animate-[scaleIn_200ms_ease]`}
        style={{ animation: 'scaleIn 200ms cubic-bezier(0.16,1,0.3,1)' }}
      >
        <p className="text-2xl mb-3">{styles.icon}</p>
        <h2 id="confirm-title" className="text-[15px] font-bold text-neutral-900 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-[13px] text-neutral-500 mb-5 leading-relaxed">{description}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
