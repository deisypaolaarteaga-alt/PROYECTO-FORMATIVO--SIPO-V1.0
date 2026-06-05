'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Decimal from 'decimal.js';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { getDetalleVersion } from '@/actions/versiones';
import type { BudgetSnapshot, SnapshotData, SnapshotCapitulo } from '@/types';

interface ModalVerVersionProps {
  snapshotId: string;
  onClose: () => void;
}

const MOTIVO_LABEL: Record<string, string> = {
  rechazo_cliente:   'Rechazo cliente',
  reapertura_manual: 'Reapertura manual',
  aprobacion:        'Aprobación',
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  });
}

function ResumenFinancieroSnapshot({ data }: { data: SnapshotData }) {
  const cd    = new Decimal(data.costo_directo ?? 0);
  const admin = cd.mul(new Decimal(data.administracion_pct ?? 0).div(100));
  const impr  = cd.mul(new Decimal(data.imprevistos_pct  ?? 0).div(100));
  const util  = cd.mul(new Decimal(data.utilidad_pct     ?? 0).div(100));
  const aiu   = admin.plus(impr).plus(util);
  const sub   = cd.plus(aiu);
  const ivaPct = new Decimal(data.iva_porcentaje ?? 19).div(100);

  let iva = new Decimal(0);
  switch (data.metodo_iva) {
    case 'sobre_utilidad': iva = util.mul(ivaPct); break;
    case 'sobre_aiu':      iva = aiu.mul(ivaPct);  break;
    case 'sobre_total':    iva = sub.mul(ivaPct);   break;
  }
  const total = sub.plus(iva);

  return (
    <div className="rounded-xl border border-[#E8E4DE] overflow-hidden">
      <div className="bg-[#F5F2EE] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
        Resumen financiero
      </div>
      <div className="divide-y divide-[#F0EDE8] text-sm">
        <Row label="Costo Directo (C.D.)"    value={cd.toNumber()}    />
        <Row label={`Administración (${data.administracion_pct}%)`} value={admin.toNumber()} sub />
        <Row label={`Imprevistos (${data.imprevistos_pct}%)`}        value={impr.toNumber()}  sub />
        <Row label={`Utilidad (${data.utilidad_pct}%)`}              value={util.toNumber()}  sub />
        <Row label="AIU"                    value={aiu.toNumber()}   />
        {iva.gt(0) && <Row label={`IVA (${data.metodo_iva?.replace(/_/g, ' ')})`} value={iva.toNumber()} />}
        <div className="flex justify-between items-center px-4 py-3 bg-[#1C1814] text-white font-bold">
          <span>Total Oferta</span>
          <span className="tabular-nums">{formatearCOP(total.toNumber())}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: number; sub?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-4 py-2.5 ${sub ? 'pl-8 text-stone-500' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums font-medium">{formatearCOP(value)}</span>
    </div>
  );
}

function CapituloRow({ cap, idx }: { cap: SnapshotCapitulo; idx: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="bg-[#F5F2EE] cursor-pointer hover:bg-[#EBE7E1] transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <td className="px-4 py-3 font-semibold text-[#1C1814]" colSpan={2}>
          <span className="flex items-center gap-2">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {idx + 1}. {cap.nombre}
          </span>
        </td>
        <td className="px-4 py-3 text-right font-semibold text-[#1C1814] tabular-nums">
          {formatearCOP(cap.valor_subtotal ?? 0)}
        </td>
      </tr>
      {open && cap.actividades.map((act, ai) => (
        <tr key={act.id} className="border-b border-[#F0EDE8]">
          <td className="px-4 py-2.5 pl-10 text-stone-700">
            {idx + 1}.{ai + 1} {act.nombre}
          </td>
          <td className="px-4 py-2.5 text-center text-stone-500 text-sm">
            {act.cantidad} {act.unidad}
          </td>
          <td className="px-4 py-2.5 text-right tabular-nums text-stone-700">
            {formatearCOP(act.subtotal ?? 0)}
          </td>
        </tr>
      ))}
    </>
  );
}

export function ModalVerVersion({ snapshotId, onClose }: ModalVerVersionProps) {
  const [snapshot, setSnapshot] = useState<BudgetSnapshot | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDetalleVersion(snapshotId).then((res) => {
      if (res.success && res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        setError(res.error ?? 'Error al cargar la versión');
      }
      setLoading(false);
    });
  }, [snapshotId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1C1814]">
              {snapshot ? `Versión v${snapshot.version}` : 'Versión del presupuesto'}
            </h2>
            {snapshot && (
              <p className="text-sm text-stone-500 mt-0.5">
                {formatearFecha(snapshot.created_at)} · {MOTIVO_LABEL[snapshot.motivo] ?? snapshot.motivo}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F5F2EE] transition-colors text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          )}

          {error && (
            <div className="text-center py-16 text-red-500">{error}</div>
          )}

          {!loading && !error && snapshot?.data && (
            <>
              {/* Tabla de capítulos */}
              <div className="rounded-xl border border-[#E8E4DE] overflow-hidden">
                <div className="bg-[#F5F2EE] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Estructura del presupuesto
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-stone-400 bg-white border-b border-[#F0EDE8]">
                      <th className="px-4 py-2.5 text-left font-medium">Ítem</th>
                      <th className="px-4 py-2.5 text-center font-medium">Cant. / Unidad</th>
                      <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.data.capitulos.map((cap, i) => (
                      <CapituloRow key={cap.id} cap={cap} idx={i} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen financiero */}
              <ResumenFinancieroSnapshot data={snapshot.data} />
            </>
          )}

          {!loading && !error && !snapshot?.data && snapshot && (
            <p className="text-center text-stone-400 py-8">
              Esta versión no contiene datos detallados (snapshot legado).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
