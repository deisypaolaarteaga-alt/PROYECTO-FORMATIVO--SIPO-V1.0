'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { enviarEmailPresupuesto, enviarEmailNotificacionConstructor } from '@/lib/email/brevo';
import Decimal from 'decimal.js';
import type { ActionResult } from '@/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcularFechaVigencia(vigenciaDias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + vigenciaDias);
  return fecha;
}

function formatearFechaVigencia(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calcularTotalOferta(budget: {
  costo_directo: number;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
  metodo_iva: string;
  iva_porcentaje: number;
}): number {
  const cd = new Decimal(budget.costo_directo ?? 0);
  const admin = cd.mul(new Decimal(budget.administracion_pct ?? 10).div(100));
  const imprevistos = cd.mul(new Decimal(budget.imprevistos_pct ?? 5).div(100));
  const utilidad = cd.mul(new Decimal(budget.utilidad_pct ?? 10).div(100));
  const subtotalConAIU = cd.plus(admin).plus(imprevistos).plus(utilidad);
  const ivaPct = new Decimal(budget.iva_porcentaje ?? 19).div(100);

  let iva = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': iva = utilidad.mul(ivaPct); break;
    case 'sobre_aiu':      iva = admin.plus(imprevistos).plus(utilidad).mul(ivaPct); break;
    case 'sobre_total':    iva = subtotalConAIU.mul(ivaPct); break;
  }

  return subtotalConAIU.plus(iva).toNumber();
}

// ── 1. enviarPresupuestoAlCliente ────────────────────────────────────────────

/**
 * Genera un token único, inserta en presupuesto_tokens y envía el email al cliente.
 * Solo puede llamarlo el dueño del presupuesto (auth requerido).
 */
export async function enviarPresupuestoAlCliente(
  budgetId: string
): Promise<ActionResult<{ token: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sesión no válida.' };

    const admin = createAdminClient();

    // ── Verificar ownership y obtener datos del presupuesto ──
    const { data: budget, error: budgetErr } = await admin
      .from('budgets')
      .select(`
        id, titulo, estado, vigencia_dias, costo_directo,
        administracion_pct, imprevistos_pct, utilidad_pct,
        metodo_iva, iva_porcentaje,
        user_id,
        projects:project_id (
          nombre,
          clientes:cliente_id (
            nombre_razon_social,
            email
          )
        )
      `)
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (budgetErr || !budget) {
      return { success: false, error: 'Presupuesto no encontrado o sin permiso de acceso.' };
    }

    // ── No reenviar si ya fue aprobado por el cliente ──
    if (budget.estado === 'aprobado_por_cliente') {
      return {
        success: false,
        error: 'El presupuesto ya fue aprobado por el cliente y no puede reenviarse.',
      };
    }

    // ── Verificar que el proyecto tiene cliente con email ──
    const proyecto = budget.projects as unknown as {
      nombre: string;
      clientes: { nombre_razon_social: string; email: string | null } | null;
    } | null;

    const clienteEmail = proyecto?.clientes?.email;
    const clienteNombre = proyecto?.clientes?.nombre_razon_social ?? null;

    if (!clienteEmail) {
      return {
        success: false,
        error: 'El proyecto no tiene un cliente asignado con dirección de correo electrónico.',
      };
    }

    // ── Datos del perfil (empresa) para el email ──
    const { data: profile } = await admin
      .from('profiles')
      .select('nombre_completo, empresa')
      .eq('id', user.id)
      .maybeSingle();

    const nombreEmpresa = profile?.empresa ?? profile?.nombre_completo ?? null;

    // ── Calcular fechas y total ──
    const vigenciaDias = budget.vigencia_dias ?? 30;
    const expiresAt = calcularFechaVigencia(vigenciaDias);
    const vigenciaFechaStr = formatearFechaVigencia(expiresAt);
    const totalOferta = calcularTotalOferta(budget as Parameters<typeof calcularTotalOferta>[0]);

    // ── Reutilizar token activo o crear uno nuevo ──
    // Buscar si ya existe un token activo (no expirado, sin respuesta del cliente)
    const { data: tokenExistente } = await admin
      .from('presupuesto_tokens')
      .select('token')
      .eq('budget_id', budgetId)
      .is('cliente_accion', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let tokenFinal: string;

    if (tokenExistente?.token) {
      tokenFinal = tokenExistente.token;
      // Actualizar la expiración y el email del destinatario
      await admin
        .from('presupuesto_tokens')
        .update({
          expires_at: expiresAt.toISOString(),
          cliente_email: clienteEmail,
          cliente_nombre: clienteNombre,
        })
        .eq('token', tokenFinal);
    } else {
      // Crear token nuevo (token se genera en BD con gen_random_bytes(32))
      const { data: nuevo, error: nuevoErr } = await admin
        .from('presupuesto_tokens')
        .insert({
          budget_id: budgetId,
          expires_at: expiresAt.toISOString(),
          cliente_email: clienteEmail,
          cliente_nombre: clienteNombre,
        })
        .select('token')
        .single();

      if (nuevoErr || !nuevo) {
        return { success: false, error: 'No se pudo crear el token de acceso.' };
      }
      tokenFinal = nuevo.token;
    }

    // ── Construir link del portal ──
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const linkPresupuesto = `${baseUrl}/presupuesto-publico/${tokenFinal}`;

    // ── Enviar email via Brevo ──
    await enviarEmailPresupuesto({
      destinatario: clienteEmail,
      nombreCliente: clienteNombre,
      nombreEmpresa,
      nombrePresupuesto: budget.titulo,
      nombreProyecto: proyecto?.nombre ?? 'Proyecto sin nombre',
      totalOferta,
      linkPresupuesto,
      vigenciaFecha: vigenciaFechaStr,
    });

    // ── Actualizar estado del presupuesto ──
    await admin
      .from('budgets')
      .update({ estado: 'enviado_a_cliente' })
      .eq('id', budgetId);

    revalidatePath('/proyectos');
    revalidatePath('/presupuestos');

    return { success: true, data: { token: tokenFinal } };
  } catch (err) {
    console.error('[enviarPresupuestoAlCliente]', err);
    return { success: false, error: 'Error al enviar el presupuesto al cliente.' };
  }
}

// ── 2. registrarVistaToken ───────────────────────────────────────────────────

/**
 * Registra que el cliente abrió el enlace. Sin auth — acción pública.
 */
export async function registrarVistaToken(
  token: string
): Promise<ActionResult<{ budget_id: string }>> {
  try {
    const admin = createAdminClient();

    const { data: tokenRow } = await admin
      .from('presupuesto_tokens')
      .select('id, budget_id, expires_at, visto_at, visto_count')
      .eq('token', token)
      .maybeSingle();

    if (!tokenRow) {
      return { success: false, error: 'Token inválido o expirado' };
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return { success: false, error: 'Token inválido o expirado' };
    }

    // visto_at: solo se registra la primera vez; visto_count siempre incrementa
    await admin
      .from('presupuesto_tokens')
      .update({
        visto_at: tokenRow.visto_at ?? new Date().toISOString(),
        visto_count: (tokenRow.visto_count ?? 0) + 1,
      })
      .eq('token', token);

    // Avanzar estado del presupuesto si viene de 'enviado_a_cliente'
    const { data: budget } = await admin
      .from('budgets')
      .select('estado')
      .eq('id', tokenRow.budget_id)
      .maybeSingle();

    if (budget?.estado === 'enviado_a_cliente') {
      await admin
        .from('budgets')
        .update({ estado: 'visto_por_cliente' })
        .eq('id', tokenRow.budget_id);
    }

    return { success: true, data: { budget_id: tokenRow.budget_id } };
  } catch (err) {
    console.error('[registrarVistaToken]', err);
    return { success: false, error: 'Error al registrar la vista del presupuesto.' };
  }
}

// ── 3. responderPresupuesto ──────────────────────────────────────────────────

/**
 * El cliente aprueba, rechaza o deja observaciones. Sin auth — acción pública.
 */
export async function responderPresupuesto(
  token: string,
  accion: 'aprobado' | 'rechazado' | 'comentado',
  comentario?: string,
  firmaNombre?: string
): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    const { data: tokenRow } = await admin
      .from('presupuesto_tokens')
      .select('id, budget_id, expires_at, cliente_accion, cliente_nombre, cliente_email')
      .eq('token', token)
      .maybeSingle();

    if (!tokenRow) {
      return { success: false, error: 'Token inválido o expirado.' };
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return { success: false, error: 'El enlace de acceso al presupuesto ha expirado.' };
    }

    if (tokenRow.cliente_accion !== null) {
      return { success: false, error: 'Ya respondiste este presupuesto anteriormente.' };
    }

    const { error: updateTokenErr } = await admin
      .from('presupuesto_tokens')
      .update({
        cliente_accion: accion,
        cliente_comentario: comentario ?? null,
        cliente_firma_nombre: firmaNombre ?? null,
        cliente_respondio_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (updateTokenErr) {
      return { success: false, error: 'No se pudo guardar la respuesta. Intenta de nuevo.' };
    }

    const estadosMap: Record<string, string> = {
      aprobado:  'aprobado_por_cliente',
      rechazado: 'rechazado_por_cliente',
      comentado: 'con_observaciones',
    };

    await admin
      .from('budgets')
      .update({ estado: estadosMap[accion] })
      .eq('id', tokenRow.budget_id);

    // ── Notificar al constructor y avanzar proyecto (no bloquea la respuesta) ─
    try {
      const { data: budgetNotif } = await admin
        .from('budgets')
        .select('id, titulo, user_id, project_id')
        .eq('id', tokenRow.budget_id)
        .maybeSingle();

      if (budgetNotif) {
        const b = budgetNotif as unknown as {
          id: string;
          titulo: string;
          user_id: string;
          project_id: string;
        };

        const [{ data: proyectoRaw }, { data: profileRaw }] = await Promise.all([
          admin.from('projects').select('id, nombre, estado').eq('id', b.project_id).maybeSingle(),
          admin.from('profiles').select('nombre_completo, email_empresa').eq('id', b.user_id).maybeSingle(),
        ]);

        const proyecto = proyectoRaw as { id: string; nombre: string; estado: string } | null;
        const profile  = profileRaw  as { nombre_completo: string | null; email_empresa: string | null } | null;

        // Obtener email del constructor: email_empresa o fallback al email de auth
        let constructorEmail: string | null = profile?.email_empresa ?? null;
        if (!constructorEmail) {
          const { data: authData } = await admin.auth.admin.getUserById(b.user_id);
          constructorEmail = authData?.user?.email ?? null;
        }

        if (constructorEmail) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
          await enviarEmailNotificacionConstructor({
            destinatario:       constructorEmail,
            nombreConstructor:  profile?.nombre_completo ?? 'Constructor',
            nombreCliente:      (tokenRow as any).cliente_nombre ?? (tokenRow as any).cliente_email ?? 'El cliente',
            nombrePresupuesto:  b.titulo,
            nombreProyecto:     proyecto?.nombre ?? 'Proyecto',
            accion,
            comentario,
            firmaNombre,
            linkPresupuesto:    `${baseUrl}/presupuestos/${b.id}`,
          });
        }

        // Avanzar proyecto de borrador a en_progreso cuando el cliente aprueba
        if (accion === 'aprobado' && proyecto?.id && proyecto.estado === 'borrador') {
          await admin
            .from('projects')
            .update({ estado: 'en_progreso' })
            .eq('id', proyecto.id)
            .eq('estado', 'borrador');
        }
      }
    } catch (notifyErr) {
      console.error('[responderPresupuesto] error al notificar al constructor:', notifyErr);
      // La respuesta del cliente ya fue guardada — no se re-lanza el error
    }

    return { success: true };
  } catch (err) {
    console.error('[responderPresupuesto]', err);
    return { success: false, error: 'Error al procesar tu respuesta.' };
  }
}

// ── 4. getTokenInfo ──────────────────────────────────────────────────────────

export interface TokenInfo {
  token: string;
  expires_at: string;
  visto_at: string | null;
  visto_count: number;
  cliente_email: string;
  cliente_nombre: string | null;
  cliente_accion: 'aprobado' | 'rechazado' | 'comentado' | null;
  cliente_comentario: string | null;
  cliente_respondio_at: string | null;
  presupuesto: {
    id: string;
    titulo: string;
    estado: string;
    costo_directo: number;
    administracion_pct: number;
    imprevistos_pct: number;
    utilidad_pct: number;
    metodo_iva: string;
    iva_porcentaje: number;
    vigencia_dias: number;
  };
  proyecto: {
    nombre: string;
    ubicacion: string | null;
  };
  empresa: {
    nombre: string | null;
    nit: string | null;
    telefono: string | null;
    email: string | null;
    ciudad: string | null;
    logo_url: string | null;
  };
  cliente: {
    nombre_razon_social: string | null;
    nit_cedula: string | null;
    nombre_contacto: string | null;
    cargo_contacto: string | null;
    ciudad: string | null;
    email: string | null;
    telefono: string | null;
  } | null;
}

/**
 * Devuelve los datos necesarios para renderizar la página pública del portal.
 * Sin auth — acción pública. NO expone user_id ni datos privados.
 */
export async function getTokenInfo(
  token: string
): Promise<ActionResult<TokenInfo>> {
  try {
    const admin = createAdminClient();

    const { data: tokenRow } = await admin
      .from('presupuesto_tokens')
      .select(`
        token,
        expires_at,
        visto_at,
        visto_count,
        cliente_email,
        cliente_nombre,
        cliente_accion,
        cliente_comentario,
        cliente_respondio_at,
        budgets:budget_id (
          id,
          titulo,
          estado,
          costo_directo,
          administracion_pct,
          imprevistos_pct,
          utilidad_pct,
          metodo_iva,
          iva_porcentaje,
          vigencia_dias,
          user_id,
          projects:project_id (
            nombre,
            ubicacion,
            cliente_id
          )
        )
      `)
      .eq('token', token)
      .maybeSingle();

    if (!tokenRow) {
      return { success: false, error: 'no_encontrado' };
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return { success: false, error: 'expirado' };
    }

    const budget = tokenRow.budgets as unknown as {
      id: string;
      titulo: string;
      estado: string;
      costo_directo: number;
      administracion_pct: number;
      imprevistos_pct: number;
      utilidad_pct: number;
      metodo_iva: string;
      iva_porcentaje: number;
      vigencia_dias: number;
      user_id: string;
      projects: { nombre: string; ubicacion: string | null; cliente_id: string | null } | null;
    } | null;

    if (!budget) {
      return { success: false, error: 'no_encontrado' };
    }

    const { data: profileRaw } = await admin
      .from('profiles')
      .select('empresa, nombre_completo, nit, telefono, email_empresa, ciudad, logo_url')
      .eq('id', budget.user_id)
      .maybeSingle();

    const profile = profileRaw as {
      empresa: string | null;
      nombre_completo: string | null;
      nit: string | null;
      telefono: string | null;
      email_empresa: string | null;
      ciudad: string | null;
      logo_url: string | null;
    } | null;

    // Fetch datos del cliente si el proyecto tiene uno asignado
    let clienteInfo: TokenInfo['cliente'] = null;
    const clienteId = budget.projects?.cliente_id ?? null;
    if (clienteId) {
      const { data: clienteRaw } = await admin
        .from('clientes')
        .select('nombre_razon_social, nit_cedula, nombre_contacto, cargo_contacto, ciudad, email, telefono')
        .eq('id', clienteId)
        .maybeSingle();
      if (clienteRaw) {
        const c = clienteRaw as any;
        clienteInfo = {
          nombre_razon_social: c.nombre_razon_social ?? null,
          nit_cedula:          c.nit_cedula          ?? null,
          nombre_contacto:     c.nombre_contacto     ?? null,
          cargo_contacto:      c.cargo_contacto      ?? null,
          ciudad:              c.ciudad              ?? null,
          email:               c.email               ?? null,
          telefono:            c.telefono            ?? null,
        };
      }
    }

    return {
      success: true,
      data: {
        token: tokenRow.token,
        expires_at: tokenRow.expires_at,
        visto_at: tokenRow.visto_at,
        visto_count: tokenRow.visto_count,
        cliente_email: tokenRow.cliente_email,
        cliente_nombre: tokenRow.cliente_nombre,
        cliente_accion: tokenRow.cliente_accion as 'aprobado' | 'rechazado' | 'comentado' | null,
        cliente_comentario: tokenRow.cliente_comentario,
        cliente_respondio_at: tokenRow.cliente_respondio_at,
        presupuesto: {
          id: budget.id,
          titulo: budget.titulo,
          estado: budget.estado,
          costo_directo: budget.costo_directo,
          administracion_pct: budget.administracion_pct,
          imprevistos_pct: budget.imprevistos_pct,
          utilidad_pct: budget.utilidad_pct,
          metodo_iva: budget.metodo_iva,
          iva_porcentaje: budget.iva_porcentaje,
          vigencia_dias: budget.vigencia_dias,
        },
        proyecto: {
          nombre: budget.projects?.nombre ?? 'Proyecto',
          ubicacion: budget.projects?.ubicacion ?? null,
        },
        empresa: {
          nombre:   profile?.empresa ?? profile?.nombre_completo ?? null,
          nit:      profile?.nit          ?? null,
          telefono: profile?.telefono     ?? null,
          email:    profile?.email_empresa ?? null,
          ciudad:   profile?.ciudad       ?? null,
          logo_url: profile?.logo_url     ?? null,
        },
        cliente: clienteInfo,
      },
    };
  } catch (err) {
    console.error('[getTokenInfo]', err);
    return { success: false, error: 'no_encontrado' };
  }
}

// ── 5. getResumenTokenPresupuesto ────────────────────────────────────────────

export interface TokenResumen {
  token: string;
  created_at: string;
  expires_at: string;
  visto_at: string | null;
  visto_count: number;
  cliente_nombre: string | null;
  cliente_email: string;
  cliente_accion: 'aprobado' | 'rechazado' | 'comentado' | null;
  cliente_comentario: string | null;
  cliente_firma_nombre: string | null;
  cliente_respondio_at: string | null;
}

/**
 * Retorna el resumen del token más reciente de un presupuesto.
 * Requiere autenticación — solo el dueño del presupuesto puede verlo.
 */
export async function getResumenTokenPresupuesto(
  budgetId: string
): Promise<ActionResult<TokenResumen | null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sesión no válida.' };

    const admin = createAdminClient();

    // Verificar ownership
    const { data: budget } = await admin
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!budget) return { success: false, error: 'Sin acceso.' };

    const { data: token } = await admin
      .from('presupuesto_tokens')
      .select(`
        token, created_at, expires_at, visto_at, visto_count,
        cliente_nombre, cliente_email, cliente_accion,
        cliente_comentario, cliente_firma_nombre, cliente_respondio_at
      `)
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { success: true, data: token as TokenResumen | null };
  } catch (err) {
    console.error('[getResumenTokenPresupuesto]', err);
    return { success: false, error: 'Error al obtener el estado del envío.' };
  }
}

// ── 6. getPresupuestoPublico ─────────────────────────────────────────────────

export interface CapituloPublico {
  id: string;
  nombre: string;
  orden: number;
  actividades: {
    id: string;
    nombre: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

/**
 * Retorna los capítulos y actividades del presupuesto para la página pública.
 * No expone datos de usuario. Valida el token antes de retornar.
 */
export async function getPresupuestoPublico(
  token: string
): Promise<ActionResult<{ tokenInfo: TokenInfo; capitulos: CapituloPublico[] }>> {
  try {
    const admin = createAdminClient();

    const { data: tokenRow } = await admin
      .from('presupuesto_tokens')
      .select('budget_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!tokenRow) return { success: false, error: 'no_encontrado' };
    if (new Date(tokenRow.expires_at) < new Date()) return { success: false, error: 'expirado' };

    // Obtener TokenInfo
    const tokenInfoResult = await getTokenInfo(token);
    if (!tokenInfoResult.success || !tokenInfoResult.data) {
      return { success: false, error: tokenInfoResult.error ?? 'no_encontrado' };
    }

    // Obtener capítulos + actividades
    // numero = campo de orden en activities (no se llama 'orden')
    // deleted_at existe en activities desde migración 20260504104000
    const { data: chapters, error: chaptersErr } = await admin
      .from('chapters')
      .select(`
        id, nombre, numero,
        activities(id, nombre, unidad, cantidad, precio_unitario, deleted_at, numero)
      `)
      .eq('budget_id', tokenRow.budget_id)
      .is('deleted_at', null)
      .order('numero', { ascending: true });

    if (chaptersErr) {
      console.error('[getPresupuestoPublico] chapters query error:', chaptersErr);
    }

    const capitulos: CapituloPublico[] = (chapters ?? []).map((ch: any) => ({
      id: ch.id,
      nombre: ch.nombre,
      orden: ch.numero ?? 0,
      actividades: ((ch.activities ?? []) as any[])
        .filter((a: any) => !a.deleted_at)
        .sort((a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0))
        .map((a: any) => ({
          id: a.id,
          nombre: a.nombre || 'Actividad',
          unidad: a.unidad || 'un',
          cantidad: Number(a.cantidad) || 0,
          precio_unitario: Number(a.precio_unitario) || 0,
        })),
    }));

    return {
      success: true,
      data: { tokenInfo: tokenInfoResult.data, capitulos },
    };
  } catch (err) {
    console.error('[getPresupuestoPublico]', err);
    return { success: false, error: 'no_encontrado' };
  }
}
