'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import Decimal from 'decimal.js';
import { formatearCOP } from '@/lib/utils/formato-cop';
import {
  getAIUComponentes,
  upsertAIUComponente,
  eliminarAIUComponente,
} from '@/actions/aiu-componentes';
import type { AIUComponente } from '@/types';

interface ConfiguracionAIUProps {
  budgetId: string;
  metodoAiu: 'porcentaje' | 'detallado';
  administracionPct: number;
  imprevistosPct: number;
  utilidadPct: number;
  costoDirecto: number;
  duracionMeses: number | null;
  bloqueado: boolean;
  onUpdateBudget: (fields: Record<string, unknown>) => void;
}

function calcularAdminLocal(
  componentes: AIUComponente[],
  duracionMeses: number,
  costoDirecto: number
): number {
  if (costoDirecto <= 0 || duracionMeses <= 0 || componentes.length === 0) return 0;
  const suma = componentes.reduce(
    (acc, c) => acc.add(new Decimal(c.valor_mensual)),
    new Decimal(0)
  );
  return suma
    .mul(new Decimal(duracionMeses))
    .div(new Decimal(costoDirecto))
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
}

export function ConfiguracionAIU({
  budgetId,
  metodoAiu,
  administracionPct,
  imprevistosPct,
  utilidadPct,
  costoDirecto,
  duracionMeses,
  bloqueado,
  onUpdateBudget,
}: ConfiguracionAIUProps) {
  const [componentes, setComponentes] = useState<AIUComponente[]>([]);
  const [loadingComponentes, setLoadingComponentes] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formValor, setFormValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const nombreInputRef = useRef<HTMLInputElement>(null);

  // Cargar componentes al entrar en modo detallado y sincronizar administracion_pct
  useEffect(() => {
    if (metodoAiu !== 'detallado') return;
    setLoadingComponentes(true);
    getAIUComponentes(budgetId).then(data => {
      setComponentes(data);
      setLoadingComponentes(false);
      // Sincronizar administracion_pct con el valor calculado de los componentes.
      // Solo si costoDirecto > 0: evita sobrescribir con 0 cuando CD aún no está cargado.
      if (data.length > 0 && costoDirecto > 0) {
        const meses = duracionMeses ?? 1;
        const pct = calcularAdminLocal(data, meses, costoDirecto);
        onUpdateBudget({ administracion_pct: pct });
      }
    });
    // costoDirecto y duracionMeses se leen del cierre en el momento del montaje.
    // Se omiten de deps intencionalmente: este efecto debe ejecutarse solo cuando
    // cambia el presupuesto o el método AIU, no con cada cambio de CD.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId, metodoAiu]);

  const recalcular = useCallback(
    (comps: AIUComponente[]) => {
      // No actualizar si el costo directo es 0: evita sobrescribir administracion_pct
      // con un valor incorrecto cuando CD aún no ha sido cargado desde la BD.
      if (costoDirecto <= 0) return;
      const meses = duracionMeses ?? 1;
      const pct = calcularAdminLocal(comps, meses, costoDirecto);
      onUpdateBudget({ administracion_pct: pct });
    },
    [duracionMeses, costoDirecto, onUpdateBudget]
  );

  // Recalcular cuando cambia la duración de la obra
  const prevMeses = useRef(duracionMeses);
  useEffect(() => {
    if (metodoAiu !== 'detallado') return;
    if (prevMeses.current === duracionMeses) return;
    prevMeses.current = duracionMeses;
    recalcular(componentes);
  }, [duracionMeses, metodoAiu, componentes, recalcular]);

  const abrirForm = () => {
    setShowForm(true);
    setTimeout(() => nombreInputRef.current?.focus(), 50);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setFormNombre('');
    setFormValor('');
  };

  const handleGuardar = async () => {
    const nombre = formNombre.trim();
    const valor = parseFloat(formValor);
    if (!nombre || isNaN(valor) || valor < 0) return;

    setGuardando(true);
    const res = await upsertAIUComponente({
      budget_id:     budgetId,
      nombre,
      valor_mensual: valor,
      orden:         componentes.length,
    });
    setGuardando(false);

    if (res.success && res.data) {
      const nuevos = [...componentes, res.data];
      setComponentes(nuevos);
      recalcular(nuevos);
      cerrarForm();
    }
  };

  const handleEliminar = async (id: string) => {
    setEliminando(id);
    const res = await eliminarAIUComponente(id);
    setEliminando(null);
    if (res.success) {
      const nuevos = componentes.filter(c => c.id !== id);
      setComponentes(nuevos);
      recalcular(nuevos);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGuardar();
    if (e.key === 'Escape') cerrarForm();
  };

  const meses = duracionMeses ?? 1;
  const totalMensual = componentes.reduce((s, c) => s + c.valor_mensual, 0);
  const totalAdmin = totalMensual * meses;
  const pctCalculado = calcularAdminLocal(componentes, meses, costoDirecto);
  const alertaAlta = pctCalculado > 15;

  return (
    <div className="space-y-4">
      {/* ── Selector de método ── */}
      <div>
        <label className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1.5 block">
          Método AIU — Administración
        </label>
        <div className="flex rounded-lg border border-[#E8E4DE] overflow-hidden text-xs">
          <button
            type="button"
            disabled={bloqueado}
            onClick={() => onUpdateBudget({ metodo_aiu: 'porcentaje' })}
            className={`flex-1 py-2 font-semibold transition-colors duration-150 ${
              metodoAiu === 'porcentaje'
                ? 'bg-[#1C1814] text-white'
                : 'bg-white text-stone hover:bg-[#F5F2EE]'
            }`}
          >
            Porcentaje
          </button>
          <button
            type="button"
            disabled={bloqueado}
            onClick={() => onUpdateBudget({ metodo_aiu: 'detallado' })}
            className={`flex-1 py-2 font-semibold transition-colors duration-150 ${
              metodoAiu === 'detallado'
                ? 'bg-[#1C1814] text-white'
                : 'bg-white text-stone hover:bg-[#F5F2EE]'
            }`}
          >
            Detallado
          </button>
        </div>
      </div>

      {/* ── ADMINISTRACIÓN — modo porcentaje ── */}
      {metodoAiu === 'porcentaje' && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
            Administración
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={administracionPct}
              onChange={e => onUpdateBudget({ administracion_pct: parseFloat(e.target.value) || 0 })}
              disabled={bloqueado}
              className="w-full h-9 bg-[#F8F7F5] border border-[#E5E1D8] rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-sm text-[#1C1814] disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-[#6B7A8D] shrink-0">%</span>
          </div>
        </div>
      )}

      {/* ── ADMINISTRACIÓN — modo detallado ── */}
      {metodoAiu === 'detallado' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
              Administración — gastos mensuales
            </label>
            {!bloqueado && (
              <button
                type="button"
                onClick={abrirForm}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B1A] hover:text-[#A83A14] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            )}
          </div>

          {/* Spinner de carga */}
          {loadingComponentes && (
            <div className="flex items-center gap-2 py-2 text-xs text-stone italic">
              <span className="h-3 w-3 border border-[#C84B1A]/30 border-t-[#C84B1A] rounded-full animate-spin" />
              Cargando…
            </div>
          )}

          {/* Lista de ítems */}
          {!loadingComponentes && componentes.length > 0 && (
            <div className="border border-[#E5E1D8] rounded-lg divide-y divide-[#F0EDE8] overflow-hidden">
              {componentes.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#F8F7F5] transition-colors group"
                >
                  <span className="flex-1 text-[12px] text-[#1C1814] truncate">{c.nombre}</span>
                  <span
                    className="text-[12px] font-semibold text-[#1C1814] tabular-nums shrink-0"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatearCOP(c.valor_mensual)}
                  </span>
                  {!bloqueado && (
                    <button
                      type="button"
                      onClick={() => handleEliminar(c.id)}
                      disabled={eliminando === c.id}
                      className="opacity-0 group-hover:opacity-100 text-stone hover:text-[#991B1B] transition-all disabled:opacity-40"
                      title="Eliminar gasto"
                    >
                      {eliminando === c.id ? (
                        <span className="h-3.5 w-3.5 border border-stone/40 border-t-stone rounded-full animate-spin block" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {!loadingComponentes && componentes.length === 0 && !showForm && (
            <p className="text-[11px] text-stone italic">
              Sin gastos registrados. Usa &quot;+ Agregar&quot; para itemizar.
            </p>
          )}

          {/* ── Formulario inline ── */}
          {showForm && !bloqueado && (
            <div className="border border-[#C84B1A]/30 rounded-lg p-3 bg-[#FFF9F7] space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
              <input
                ref={nombreInputRef}
                type="text"
                placeholder="Nombre del gasto (ej: Arriendo oficina)"
                value={formNombre}
                onChange={e => setFormNombre(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-8 bg-white border border-[#E5E1D8] rounded px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#C84B1A]/40 text-[#1C1814]"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Valor mensual $"
                  value={formValor}
                  onChange={e => setFormValor(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="0"
                  className="flex-1 h-8 bg-white border border-[#E5E1D8] rounded px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#C84B1A]/40 text-[#1C1814]"
                />
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={guardando || !formNombre.trim() || !formValor}
                  title="Guardar gasto"
                  className="h-8 w-8 flex items-center justify-center rounded bg-[#C84B1A] text-white disabled:opacity-40 hover:bg-[#A83A14] transition-colors shrink-0"
                >
                  {guardando ? (
                    <span className="h-3.5 w-3.5 border border-white/40 border-t-white rounded-full animate-spin block" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={cerrarForm}
                  title="Cancelar"
                  className="h-8 w-8 flex items-center justify-center rounded border border-[#E5E1D8] text-stone hover:text-[#1C1814] hover:border-[#1C1814] transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Resumen calculado ── */}
          {!loadingComponentes && componentes.length > 0 && (
            <div className="bg-[#F8F7F5] rounded-lg p-3 space-y-1.5 text-[11px] border border-[#E5E1D8]">
              <div className="flex justify-between text-stone">
                <span>Total mensual</span>
                <span
                  className="font-semibold text-[#1C1814] tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatearCOP(totalMensual)}
                </span>
              </div>
              <div className="flex justify-between text-stone">
                <span>× {meses} {meses === 1 ? 'mes' : 'meses'}</span>
                <span
                  className="font-semibold text-[#1C1814] tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatearCOP(totalAdmin)}
                </span>
              </div>
              {costoDirecto > 0 && (
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E1D8]">
                  <span className="text-stone text-[10px]">
                    Sobre C.D. ({formatearCOP(costoDirecto)})
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 tabular-nums ${
                      alertaAlta ? 'text-amber-600' : 'text-[#2D7A45]'
                    }`}
                  >
                    {pctCalculado.toFixed(2)}%
                    {alertaAlta ? (
                      <span
                        title="El promedio del mercado colombiano es 8–15%. Verifica que tus gastos sean correctos."
                        className="cursor-help"
                      >
                        ⚠️
                      </span>
                    ) : (
                      <span className="text-[#2D7A45]">✓</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── IMPREVISTOS — siempre manual ── */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
          Imprevistos
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={imprevistosPct}
            onChange={e => onUpdateBudget({ imprevistos_pct: parseFloat(e.target.value) || 0 })}
            disabled={bloqueado}
            className="w-full h-9 bg-[#F8F7F5] border border-[#E5E1D8] rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-sm text-[#1C1814] disabled:opacity-50"
          />
          <span className="text-sm font-semibold text-[#6B7A8D] shrink-0">%</span>
        </div>
      </div>

      {/* ── UTILIDAD — siempre manual ── */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
          Utilidad
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={utilidadPct}
            onChange={e => onUpdateBudget({ utilidad_pct: parseFloat(e.target.value) || 0 })}
            disabled={bloqueado}
            className="w-full h-9 bg-[#F8F7F5] border border-[#E5E1D8] rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-sm text-[#1C1814] disabled:opacity-50"
          />
          <span className="text-sm font-semibold text-[#6B7A8D] shrink-0">%</span>
        </div>
      </div>
    </div>
  );
}
