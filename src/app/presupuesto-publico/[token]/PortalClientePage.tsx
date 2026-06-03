'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { registrarVistaToken, responderPresupuesto, type TokenInfo, type CapituloPublico } from '@/actions/portal-cliente';
import Decimal from 'decimal.js';

// ── Helpers financieros ────────────────────────────────────────────────────

function formatearCOP(valor: number): string {
  return `$${new Decimal(valor).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;
}

function calcularResumen(p: TokenInfo['presupuesto']) {
  const cd   = new Decimal(p.costo_directo ?? 0);
  const adm  = cd.mul(new Decimal(p.administracion_pct ?? 10).div(100));
  const imp  = cd.mul(new Decimal(p.imprevistos_pct  ??  5).div(100));
  const util = cd.mul(new Decimal(p.utilidad_pct     ?? 10).div(100));
  const aiu  = adm.plus(imp).plus(util);
  const sub  = cd.plus(aiu);
  const ivaPct = new Decimal(p.iva_porcentaje ?? 19).div(100);

  let iva = new Decimal(0);
  switch (p.metodo_iva) {
    case 'sobre_utilidad': iva = util.mul(ivaPct); break;
    case 'sobre_aiu':      iva = aiu.mul(ivaPct);  break;
    case 'sobre_total':    iva = sub.mul(ivaPct);  break;
  }

  return {
    costoDirecto:   cd.toNumber(),
    aiu:            aiu.toNumber(),
    iva:            iva.toNumber(),
    totalOferta:    sub.plus(iva).toNumber(),
  };
}

function formatFecha(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Bogota',
  }).format(new Date(iso));
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  token: string;
  tokenInfo: TokenInfo;
  capitulos: CapituloPublico[];
}

// ── Sección de respuesta ───────────────────────────────────────────────────

type Accion = 'aprobado' | 'rechazado' | 'comentado';
type Pantalla = 'formulario' | 'confirmando' | 'exito';

function SeccionRespuesta({ token, totalStr }: { token: string; totalStr: string }) {
  const [pantalla, setPantalla]     = useState<Pantalla>('formulario');
  const [firmaNombre, setFirmaNombre] = useState('');
  const [comentario, setComentario] = useState('');
  const [accionPendiente, setAccionPendiente] = useState<Accion | null>(null);
  const [enviando, setEnviando]     = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  function solicitarConfirmacion(accion: Accion) {
    if (!firmaNombre.trim()) {
      setErrorMsg('Por favor, ingresa tu nombre completo antes de continuar.');
      return;
    }
    setErrorMsg('');
    setAccionPendiente(accion);
    setPantalla('confirmando');
  }

  async function confirmar() {
    if (!accionPendiente) return;
    setEnviando(true);
    const result = await responderPresupuesto(
      token,
      accionPendiente,
      comentario.trim() || undefined,
      firmaNombre.trim()
    );
    setEnviando(false);
    if (result.success) {
      setPantalla('exito');
    } else {
      setErrorMsg(result.error ?? 'No se pudo guardar la respuesta. Intenta de nuevo.');
      setPantalla('formulario');
    }
  }

  if (pantalla === 'exito' && accionPendiente) {
    const configs = {
      aprobado:  { bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />, titulo: '¡Presupuesto aprobado!', texto: 'El constructor ha sido notificado de tu aprobación.' },
      rechazado: { bg: 'bg-red-50 border-red-200',         icon: <XCircle className="h-10 w-10 text-red-500" />,         titulo: 'Presupuesto rechazado',   texto: 'Hemos notificado al constructor tu decisión.' },
      comentado: { bg: 'bg-amber-50 border-amber-200',     icon: <MessageSquare className="h-10 w-10 text-amber-500" />, titulo: 'Observaciones enviadas', texto: 'Tus comentarios fueron enviados al constructor.' },
    };
    const cfg = configs[accionPendiente];
    return (
      <div className={`rounded-2xl border p-8 text-center space-y-4 ${cfg.bg}`}>
        <div className="flex justify-center">{cfg.icon}</div>
        <h3 className="text-xl font-bold text-[#1C1814]">{cfg.titulo}</h3>
        <p className="text-sm text-[#6B7280]">{cfg.texto}</p>
        <p className="text-xs text-[#9CA3AF]">Puedes cerrar esta página.</p>
      </div>
    );
  }

  if (pantalla === 'confirmando' && accionPendiente) {
    const mensajes: Record<Accion, string> = {
      aprobado:  `¿Confirmas la aprobación de este presupuesto por ${totalStr}? Esta acción quedará registrada.`,
      rechazado: '¿Confirmas el rechazo? El constructor será notificado.',
      comentado: '¿Enviar tus observaciones al constructor?',
    };
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 space-y-4 shadow-sm">
        <p className="text-base font-semibold text-[#1C1814]">Confirmar acción</p>
        <p className="text-sm text-[#6B7280]">{mensajes[accionPendiente]}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setPantalla('formulario')}
            disabled={enviando}
            className="flex-1 h-10 text-sm font-medium border border-[#E8E4DE] rounded-xl text-stone hover:bg-[#F5F2EE] transition-colors disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={confirmar}
            disabled={enviando}
            className="flex-1 h-10 text-sm font-semibold rounded-xl bg-[#C84B1A] hover:bg-[#A83A14] text-white transition-colors disabled:opacity-60"
          >
            {enviando ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando…
              </span>
            ) : 'Sí, confirmar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 space-y-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-[#1C1814]">¿Deseas aprobar este presupuesto?</h3>
        <p className="text-sm text-[#6B7280] mt-1">Tu respuesta quedará registrada. Solo puedes responder una vez.</p>
      </div>

      {/* Nombre completo */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-stone uppercase tracking-widest">
          Tu nombre completo <span className="text-[#C84B1A]">*</span>
        </label>
        <input
          type="text"
          value={firmaNombre}
          onChange={e => setFirmaNombre(e.target.value)}
          placeholder="Ej: Carlos Ramírez Quintero"
          className="w-full h-10 bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl px-4 text-sm text-[#1C1814] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C84B1A]/20 focus:border-[#C84B1A] transition-colors"
        />
      </div>

      {/* Observaciones */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-stone uppercase tracking-widest">
          Observaciones o comentarios <span className="text-[#9CA3AF] font-normal normal-case">(opcional)</span>
        </label>
        <textarea
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Escribe aquí cualquier observación, solicitud de ajuste o comentario…"
          rows={3}
          className="w-full bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl px-4 py-3 text-sm text-[#1C1814] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C84B1A]/20 focus:border-[#C84B1A] transition-colors resize-none"
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <button
          onClick={() => solicitarConfirmacion('aprobado')}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          Aprobar
        </button>
        <button
          onClick={() => solicitarConfirmacion('rechazado')}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
        >
          <XCircle className="h-4 w-4" />
          Rechazar
        </button>
        <button
          onClick={() => solicitarConfirmacion('comentado')}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#F5F0EA] hover:bg-[#EDE6DC] text-[#5A5248] border border-[#E8E4DE] text-sm font-semibold transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Solo comentar
        </button>
      </div>
    </div>
  );
}

// ── Tabla de capítulos ─────────────────────────────────────────────────────

function formatCant(v: number): string {
  const d = new Decimal(v);
  return d.isZero() ? '' : d.toFixed(2);
}

function TablaCapitulos({ capitulos }: { capitulos: CapituloPublico[] }) {
  const [expandidos, setExpandidos] = useState<Set<string>>(
    new Set(capitulos.map(c => c.id))
  );

  function toggle(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalCD = capitulos
    .reduce((sum, ch) =>
      sum.plus(
        ch.actividades.reduce(
          (s, a) => s.plus(new Decimal(a.cantidad).mul(new Decimal(a.precio_unitario))),
          new Decimal(0)
        )
      ),
      new Decimal(0)
    )
    .toNumber();

  return (
    <div className="space-y-2">
      {capitulos.map((ch, idx) => {
        const chTotal = ch.actividades
          .reduce(
            (s, a) => s.plus(new Decimal(a.cantidad).mul(new Decimal(a.precio_unitario))),
            new Decimal(0)
          )
          .toNumber();
        const pct = totalCD > 0 ? new Decimal(chTotal).div(totalCD).mul(100).toFixed(1) : null;
        const isOpen = expandidos.has(ch.id);

        return (
          <div key={ch.id} className="bg-white rounded-xl border border-[#E8E4DE] overflow-hidden shadow-sm">
            {/* Encabezado del capítulo */}
            <button
              onClick={() => toggle(ch.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F0EA] hover:bg-[#EDE6DC] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-[#6B7A8D] shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-[#6B7A8D] shrink-0" />}
                <span className="h-5 w-5 rounded bg-[#FAF0EB] flex items-center justify-center text-[9px] font-bold text-[#C84B1A] shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-bold text-[11px] uppercase tracking-wide text-[#1C1814] truncate">
                  {ch.nombre.replace(/^\d{1,3}[\.\-\s]+/, '')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {pct && (
                  <span className="hidden sm:inline text-[10px] font-bold text-[#C84B1A] bg-[#FAF0EB] px-1.5 py-0.5 rounded-full border border-[#C84B1A]/20">
                    {pct}%&nbsp;CD
                  </span>
                )}
                <span className="font-semibold text-sm text-[#1C1814] tabular-nums whitespace-nowrap">
                  {formatearCOP(chTotal)}
                </span>
              </div>
            </button>

            {/* Filas de actividades */}
            {isOpen && ch.actividades.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wide text-stone bg-[#F8F6F3] border-b border-[#E8E4DE]">
                      <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                      <th className="hidden sm:table-cell px-2 py-2 text-left font-semibold w-14">Und.</th>
                      <th className="hidden md:table-cell px-2 py-2 text-right font-semibold w-20">Cant.</th>
                      <th className="hidden md:table-cell px-3 py-2 text-right font-semibold w-32">P. Unit.</th>
                      <th className="px-3 py-2 text-right font-semibold w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EDE8]">
                    {ch.actividades.map(act => {
                      const cant   = new Decimal(act.cantidad);
                      const precio = new Decimal(act.precio_unitario);
                      const total  = cant.mul(precio);
                      const sinCant   = cant.isZero();
                      const sinPrecio = precio.isZero();
                      const sinTotal  = sinCant || sinPrecio;

                      return (
                        <tr key={act.id} className="hover:bg-[#FAFAF9] align-middle">
                          <td className="px-4 py-2.5 text-[#1C1814] text-sm leading-snug">
                            {act.nombre}
                          </td>
                          <td className="hidden sm:table-cell px-2 py-2.5 text-stone text-xs">
                            {act.unidad}
                          </td>
                          <td className="hidden md:table-cell px-2 py-2.5 text-right text-xs tabular-nums">
                            {sinCant
                              ? <span className="text-[#C4BAB0]">—</span>
                              : <span className="text-stone">{formatCant(act.cantidad)}</span>}
                          </td>
                          <td className="hidden md:table-cell px-3 py-2.5 text-right text-xs tabular-nums">
                            {sinPrecio
                              ? <span className="text-[#C4BAB0]">—</span>
                              : <span className="text-stone">{formatearCOP(precio.toNumber())}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm tabular-nums">
                            {sinTotal
                              ? <span className="text-[#C4BAB0] font-normal">—</span>
                              : <span className="font-semibold text-[#1C1814]">{formatearCOP(total.toNumber())}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {isOpen && ch.actividades.length === 0 && (
              <p className="px-4 py-3 text-xs text-stone italic">Sin actividades registradas.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Partes del contrato ────────────────────────────────────────────────────

function SeccionPartes({
  empresa,
  cliente,
}: {
  empresa: TokenInfo['empresa'];
  cliente: TokenInfo['cliente'];
}) {
  const hayConstructor = !!(empresa.nombre || empresa.nit || empresa.ciudad);
  const hayCliente = !!cliente;

  if (!hayConstructor && !hayCliente) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* ELABORADO POR */}
      {hayConstructor && (
        <div className="bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-sm">
          <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-3">
            Elaborado por
          </p>
          <div className="flex items-start gap-3">
            {empresa.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={empresa.logo_url}
                alt="Logo empresa"
                className="h-10 w-10 object-contain rounded-lg shrink-0"
              />
            ) : empresa.nombre ? (
              <div className="h-10 w-10 rounded-full bg-[#C84B1A] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-base leading-none">
                  {empresa.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : null}
            <div className="space-y-0.5 min-w-0">
              {empresa.nombre && (
                <p className="font-semibold text-sm text-[#1C1814] truncate">{empresa.nombre}</p>
              )}
              {empresa.nit && (
                <p className="text-xs text-stone">NIT: {empresa.nit}</p>
              )}
              {empresa.ciudad && (
                <p className="text-xs text-stone">{empresa.ciudad}</p>
              )}
              {empresa.telefono && (
                <p className="text-xs text-stone">Tel.: {empresa.telefono}</p>
              )}
              {empresa.email && (
                <p className="text-xs text-stone truncate">{empresa.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ELABORADO PARA */}
      {hayCliente && cliente && (
        <div className="bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-sm">
          <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-3">
            Elaborado para
          </p>
          <div className="space-y-0.5">
            {cliente.nombre_razon_social && (
              <p className="font-semibold text-sm text-[#1C1814]">
                {cliente.nombre_razon_social}
              </p>
            )}
            {cliente.nit_cedula && (
              <p className="text-xs text-stone">NIT/C.C.: {cliente.nit_cedula}</p>
            )}
            {cliente.ciudad && (
              <p className="text-xs text-stone">{cliente.ciudad}</p>
            )}
            {cliente.nombre_contacto && (
              <p className="text-xs text-stone">
                Contacto: {cliente.nombre_contacto}
                {cliente.cargo_contacto && ` · ${cliente.cargo_contacto}`}
              </p>
            )}
            {cliente.telefono && (
              <p className="text-xs text-stone">Tel.: {cliente.telefono}</p>
            )}
            {cliente.email && (
              <p className="text-xs text-stone truncate">{cliente.email}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export function PortalClientePage({ token, tokenInfo, capitulos }: Props) {
  const { presupuesto, proyecto, empresa } = tokenInfo;
  const resumen = calcularResumen(presupuesto);
  const vigenciaFecha = formatFecha(tokenInfo.expires_at);
  const diasRestantes = Math.floor(
    (new Date(tokenInfo.expires_at).getTime() - Date.now()) / 86_400_000
  );

  // Registrar vista al cargar
  useEffect(() => {
    registrarVistaToken(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yaRespondio = !!tokenInfo.cliente_accion;

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DE] sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-white font-black text-xs">S</span>
            </div>
            <span className="font-bold text-sm text-[#1C1814] hidden sm:block">SIPO</span>
          </div>
          {empresa.nombre && (
            <span className="text-sm font-semibold text-[#5A5248] truncate max-w-[200px]">
              {empresa.nombre}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Tarjeta de cabecera del presupuesto */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden shadow-sm">
          <div className="bg-[#1A1A1A] px-6 py-5">
            <p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-widest mb-1">Presupuesto de Obra</p>
            <h1 className="text-xl font-bold text-white leading-tight">{presupuesto.titulo}</h1>
          </div>
          <div className="px-6 py-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-[10px] font-bold text-stone uppercase tracking-widest">Proyecto</p>
              <p className="font-semibold text-[#1C1814]">{proyecto.nombre}</p>
            </div>
            {proyecto.ubicacion && (
              <div>
                <p className="text-[10px] font-bold text-stone uppercase tracking-widest">Ubicación</p>
                <p className="font-semibold text-[#1C1814]">{proyecto.ubicacion}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-stone uppercase tracking-widest">Válido hasta</p>
              <p className={`font-semibold ${diasRestantes < 7 ? 'text-red-600' : diasRestantes < 30 ? 'text-amber-600' : 'text-[#1C1814]'}`}>
                {vigenciaFecha}
                {diasRestantes >= 0 && <span className="font-normal text-stone ml-1">({diasRestantes} días)</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Constructora y cliente */}
        <SeccionPartes empresa={empresa} cliente={tokenInfo.cliente} />

        {/* Resumen financiero */}
        <div>
          <h2 className="text-[11px] font-bold text-stone uppercase tracking-widest mb-3">Resumen financiero</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Costo Directo',      valor: resumen.costoDirecto,  accent: false },
              { label: 'AIU',                 valor: resumen.aiu,           accent: false },
              { label: 'IVA',                 valor: resumen.iva,           accent: false },
              { label: 'Total Oferta',        valor: resumen.totalOferta,   accent: true  },
            ].map(({ label, valor, accent }) => (
              <div
                key={label}
                className={`rounded-xl border p-4 ${accent ? 'bg-[#C84B1A] border-[#C84B1A] text-white' : 'bg-white border-[#E8E4DE]'}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${accent ? 'text-white/70' : 'text-stone'}`}>
                  {label}
                </p>
                <p className={`text-base font-bold tabular-nums leading-tight ${accent ? 'text-white' : 'text-[#1C1814]'}`}>
                  {formatearCOP(valor)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de capítulos y actividades */}
        {capitulos.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold text-stone uppercase tracking-widest mb-3">Detalle del presupuesto</h2>
            <TablaCapitulos capitulos={capitulos} />
          </div>
        )}

        {/* Sección de respuesta del cliente */}
        <div>
          <h2 className="text-[11px] font-bold text-stone uppercase tracking-widest mb-3">Tu respuesta</h2>

          {yaRespondio ? (
            <div className={`rounded-2xl border p-6 space-y-2 ${
              tokenInfo.cliente_accion === 'aprobado'  ? 'bg-emerald-50 border-emerald-200'
              : tokenInfo.cliente_accion === 'rechazado' ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
            }`}>
              <p className="font-semibold text-[#1C1814]">
                {tokenInfo.cliente_accion === 'aprobado'  ? '✅ Aprobaste este presupuesto'
                  : tokenInfo.cliente_accion === 'rechazado' ? '❌ Rechazaste este presupuesto'
                  : '💬 Enviaste observaciones'}
              </p>
              {tokenInfo.cliente_respondio_at && (
                <p className="text-sm text-[#6B7280]">
                  El {formatFecha(tokenInfo.cliente_respondio_at)}
                </p>
              )}
              {tokenInfo.cliente_comentario && (
                <p className="text-sm text-[#374151] italic mt-2">"{tokenInfo.cliente_comentario}"</p>
              )}
            </div>
          ) : (
            <SeccionRespuesta token={token} totalStr={formatearCOP(resumen.totalOferta)} />
          )}
        </div>

        {/* Pie de página */}
        <footer className="text-center text-xs text-stone py-4 border-t border-[#E8E4DE]">
          Generado por <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
          Este enlace es válido hasta el {vigenciaFecha}.
        </footer>

      </main>
    </div>
  );
}
