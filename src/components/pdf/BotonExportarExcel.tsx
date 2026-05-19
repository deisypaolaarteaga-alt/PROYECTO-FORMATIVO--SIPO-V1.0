'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';
import type { PresupuestoPDFData, ConfigPDFProfesional } from '@/types/pdf';

interface Props {
  budget: PresupuestoPDFData;
  profile: ConfigPDFProfesional;
}

export function BotonExportarExcel({ budget, profile }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExportar = async () => {
    setLoading(true);
    try {
      const { exportarPresupuestoExcel } = await import('@/lib/excel/exportarPresupuestoExcel');
      exportarPresupuestoExcel(budget, profile);
      toast.success('Excel generado exitosamente');
    } catch {
      toast.error('No se pudo generar el Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExportar}
      variant="ghost"
      size="sm"
      loading={loading}
      icon={<FileSpreadsheet className="h-4 w-4" />}
    >
      {loading ? 'Generando…' : 'Exportar Excel'}
    </Button>
  );
}
