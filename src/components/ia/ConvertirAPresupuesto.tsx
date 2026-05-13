'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@/components/shared/Modal';
import { parseBudgetResponse } from '@/lib/anthropic/parser';
import { createBudgetFromAI } from '@/actions/presupuestos';
import { toast } from 'sonner';

interface ConvertirAPresupuestoProps {
  messages: any[];
  projects: any[];
  selectedProjectId?: string;
}

export function ConvertirAPresupuesto({ 
  messages, 
  projects, 
  selectedProjectId 
}: ConvertirAPresupuestoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(selectedProjectId || '');
  const router = useRouter();

  // Buscar el último mensaje que contenga JSON
  const lastAIMessage = [...messages].reverse().find(m => 
    m.role === 'assistant' && m.content.includes('JSON_BUDGET_DATA')
  );

  const budgetData = lastAIMessage ? parseBudgetResponse(lastAIMessage.content) : null;

  const handleSave = async () => {
    if (!budgetData || !projectId) {
      toast.error('Selecciona un proyecto para guardar.');
      return;
    }

    setLoading(true);
    try {
      const res = await createBudgetFromAI(projectId, budgetData);
      if (res.success) {
        toast.success('Presupuesto creado con éxito');
        setIsOpen(false);
        router.push(`/proyectos/${projectId}/presupuestos/${(res.data as any).budgetId}`);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error('Error al guardar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  if (!budgetData) return null;

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <Button variant="primary" size="sm" icon={<Save className="h-3.5 w-3.5" />}>
          Guardar presupuesto
        </Button>
      </ModalTrigger>
      
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success-500" />
            Convertir respuesta en presupuesto
          </ModalTitle>
          <ModalDescription>
            He detectado un presupuesto estructurado en la conversación. 
            Puedes guardarlo directamente en uno de tus proyectos.
          </ModalDescription>
        </ModalHeader>

        <div className="py-4 space-y-4">
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Resumen detectado</p>
            <h4 className="font-bold text-neutral-900">{budgetData.titulo}</h4>
            <div className="mt-2 text-sm text-neutral-600">
              <p>{budgetData.capitulos.length} capítulos detectados</p>
              <ul className="mt-1 list-disc list-inside text-xs text-neutral-500">
                {budgetData.capitulos.slice(0, 3).map((c, i) => (
                  <li key={i}>{c.nombre}</li>
                ))}
                {budgetData.capitulos.length > 3 && <li>... y {budgetData.capitulos.length - 3} más</li>}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Proyecto asociado</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
            >
              <option value="">Selecciona un proyecto...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {!projectId && (
            <div className="flex items-start gap-2 p-3 bg-warning-50 rounded-lg text-warning-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Debes seleccionar o crear un proyecto primero para guardar el presupuesto.</span>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            loading={loading}
            disabled={!projectId}
          >
            Confirmar y guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
