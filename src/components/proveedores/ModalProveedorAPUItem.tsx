'use client';

import { useEffect, useState } from 'react';
import { Building2, Phone, Mail, Tag, AlertCircle, Loader2, X } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { getProveedores, getProveedor, asignarProveedorAInsumos } from '@/actions/proveedores';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Proveedor, TipoAPUItem } from '@/types';

const CATEGORIA_LABEL: Record<string, string> = {
  ferreteria:  'Ferretería',
  contratista: 'Contratista',
  equipos:     'Equipos',
  laboratorio: 'Laboratorio',
  transporte:  'Transporte',
  servicios:   'Servicios',
  otro:        'Otro',
};

interface Props {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  nombre: string;
  unidad: string;
  tipo: TipoAPUItem;
  proveedorId: string | null;
  onSuccess: () => void;
}

export function ModalProveedorAPUItem({
  open,
  onClose,
  budgetId,
  nombre,
  unidad,
  tipo,
  proveedorId,
  onSuccess,
}: Props) {
  const tieneProveedor = proveedorId !== null;

  // Modo interno: 'ver' cuando ya tiene proveedor, 'asignar' para seleccionar uno
  const [modo, setModo] = useState<'ver' | 'asignar'>(tieneProveedor ? 'ver' : 'asignar');

  const [proveedorActual, setProveedorActual] = useState<Proveedor | null>(null);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>([]);
  const [seleccionado, setSeleccionado] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [quitando, setQuitando] = useState(false);

  // Al abrir el modal, sincronizar modo y cargar datos
  useEffect(() => {
    if (!open) return;
    setModo(tieneProveedor ? 'ver' : 'asignar');
    setSeleccionado('');

    if (tieneProveedor) {
      setCargando(true);
      getProveedor(proveedorId!).then(p => {
        setProveedorActual(p);
        setCargando(false);
      });
    } else {
      setProveedorActual(null);
    }
  }, [open, proveedorId, tieneProveedor]);

  // Cargar lista de proveedores cuando se entra en modo asignar
  useEffect(() => {
    if (!open || modo !== 'asignar') return;
    getProveedores().then(lista => setListaProveedores(lista as Proveedor[]));
  }, [open, modo]);

  async function handleGuardar() {
    if (!seleccionado) return;
    setGuardando(true);
    const result = await asignarProveedorAInsumos(budgetId, nombre, unidad, tipo, seleccionado);
    setGuardando(false);
    if (result.success) {
      toast.success('Proveedor asignado correctamente');
      onSuccess();
      onClose();
    } else {
      toast.error(result.error ?? 'Error al asignar el proveedor');
    }
  }

  async function handleQuitar() {
    setQuitando(true);
    const result = await asignarProveedorAInsumos(budgetId, nombre, unidad, tipo, null);
    setQuitando(false);
    if (result.success) {
      toast.success('Proveedor quitado del insumo');
      onSuccess();
      onClose();
    } else {
      toast.error(result.error ?? 'Error al quitar el proveedor');
    }
  }

  return (
    <Modal open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>
            {modo === 'ver' ? 'Proveedor asignado' : 'Asignar proveedor'}
          </ModalTitle>
          <ModalDescription className="text-xs text-stone mt-0.5">
            <span className="font-medium text-ink">{nombre}</span>
            {' · '}
            <span className="bg-sand border border-concrete text-stone px-1.5 py-0.5 rounded text-[11px]">
              {unidad}
            </span>
          </ModalDescription>
        </ModalHeader>

        {/* ── Modo: ver proveedor asignado ── */}
        {modo === 'ver' && (
          <div className="space-y-4">
            {cargando ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-stone" />
              </div>
            ) : proveedorActual ? (
              <ProveedorDetalle proveedor={proveedorActual} />
            ) : (
              <div className="flex items-center gap-2 text-sm text-danger-text bg-danger-bg rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                No se pudo cargar la información del proveedor.
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setModo('asignar')}
              >
                Cambiar proveedor
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={quitando}
                onClick={handleQuitar}
              >
                Quitar
              </Button>
            </div>
          </div>
        )}

        {/* ── Modo: asignar proveedor ── */}
        {modo === 'asignar' && (
          <div className="space-y-4">
            {listaProveedores.length === 0 ? (
              <SinProveedores />
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone uppercase tracking-wider">
                  Seleccionar proveedor
                </label>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-concrete divide-y divide-sand">
                  {listaProveedores.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSeleccionado(p.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors duration-100',
                        'hover:bg-sand/60',
                        seleccionado === p.id
                          ? 'bg-burn-pale border-l-2 border-burn-orange'
                          : 'bg-white'
                      )}
                    >
                      <p className="text-sm font-medium text-ink leading-snug">
                        {p.nombre_razon_social}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-stone">
                          {CATEGORIA_LABEL[p.categoria] ?? p.categoria}
                        </span>
                        {p.ciudad && (
                          <>
                            <span className="text-concrete">·</span>
                            <span className="text-[11px] text-stone">{p.ciudad}</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {tieneProveedor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModo('ver')}
                >
                  Cancelar
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                disabled={!seleccionado || listaProveedores.length === 0}
                loading={guardando}
                onClick={handleGuardar}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

// ── Tarjeta de detalle del proveedor ──────────────────────────────────────────

function ProveedorDetalle({ proveedor }: { proveedor: Proveedor }) {
  return (
    <div className="rounded-xl border border-concrete bg-sand/40 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-burn-pale flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-burn-orange" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink leading-snug">
            {proveedor.nombre_razon_social}
          </p>
          {proveedor.nit_cedula && (
            <p className="text-xs text-stone mt-0.5">NIT/CC {proveedor.nit_cedula}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <DetalleFila
          icono={<Tag className="h-3.5 w-3.5" />}
          valor={CATEGORIA_LABEL[proveedor.categoria] ?? proveedor.categoria}
        />
        {proveedor.telefono && (
          <DetalleFila
            icono={<Phone className="h-3.5 w-3.5" />}
            valor={proveedor.telefono}
          />
        )}
        {proveedor.email && (
          <DetalleFila
            icono={<Mail className="h-3.5 w-3.5" />}
            valor={proveedor.email}
          />
        )}
        {proveedor.ciudad && (
          <p className="text-xs text-stone pl-5">{proveedor.ciudad}</p>
        )}
      </div>
    </div>
  );
}

function DetalleFila({ icono, valor }: { icono: React.ReactNode; valor: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-stone">
      <span className="text-mortar shrink-0">{icono}</span>
      <span className="truncate">{valor}</span>
    </div>
  );
}

// ── Estado vacío sin proveedores ──────────────────────────────────────────────

function SinProveedores() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="w-10 h-10 rounded-xl bg-sand border border-concrete flex items-center justify-center">
        <Building2 className="h-5 w-5 text-mortar" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Sin proveedores registrados</p>
        <p className="text-xs text-stone mt-1 max-w-[220px]">
          Agrega proveedores en el módulo{' '}
          <span className="font-medium text-ink">Proveedores</span>{' '}
          para poder asignarlos aquí.
        </p>
      </div>
    </div>
  );
}
