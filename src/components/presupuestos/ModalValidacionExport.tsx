'use client';

import { Button } from '@/components/shared/Button';
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '@/components/shared/Modal';
import { AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import type { ValidacionExportacion } from '@/lib/presupuestos/validarAntesDeExportar';

interface ModalValidacionExportProps {
  open: boolean;
  validation: ValidacionExportacion | null;
  onClose: () => void;
  onConfirm: () => void;
  onFix: () => void;
}

export function ModalValidacionExport({
  open,
  validation,
  onClose,
  onConfirm,
  onFix,
}: ModalValidacionExportProps) {
  const errors = validation?.errores ?? [];
  const warnings = validation?.advertencias ?? [];
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <Modal open={open} onOpenChange={(value) => !value && onClose()}>
      <ModalContent className="max-w-xl">
        <ModalHeader className="mb-4">
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <XCircle className="h-5 w-5 text-[#991B1B]" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-[#7A4B00]" />
            )}
            <ModalTitle className="text-[#1F2937]">Validación antes de exportar</ModalTitle>
          </div>
          <ModalDescription className="mt-1 text-[#6B7A8D]">
            {hasErrors
              ? 'El PDF no puede generarse hasta que se corrijan los errores bloqueantes.'
              : 'Se detectaron advertencias. Puedes exportar si deseas, pero revisa primero.'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-5 text-sm text-[#4B5563]">
          {hasErrors && (
            <div className="rounded-xl border border-[#F5C2C2] bg-[#FEF0F0] p-4">
              <div className="font-bold text-[#991B1B] mb-2">Errores bloqueantes</div>
              <ul className="space-y-2 list-disc list-inside text-[#991B1B]">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {hasWarnings && (
            <div className="rounded-xl border border-[#F0D080] bg-[#FEF3E2] p-4">
              <div className="font-bold text-[#7A4B00] mb-2">Advertencias</div>
              <ul className="space-y-2 list-disc list-inside text-[#7A4B00]">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ModalFooter className="mt-6 gap-3">
          {hasErrors ? (
            <Button variant="outline" onClick={onFix} className="w-full">
              Ir a corregir
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose} className="w-full">
                Cancelar
              </Button>
              <Button variant="primary" onClick={onConfirm} className="w-full">
                Exportar de todas formas
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
