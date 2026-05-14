/**
 * scripts/verificar-rls.ts
 *
 * Verifica que el aislamiento RLS entre usuarios funciona correctamente.
 * Crea user_A y user_B, inserta datos como user_B vía admin (bypasando RLS),
 * se autentica como user_A e intenta leer/modificar datos de user_B.
 *
 * Uso: npx tsx scripts/verificar-rls.ts
 *
 * Requiere variables de entorno en .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY         = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Faltan variables de entorno.\n' +
    '   Asegúrate de tener: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TS       = Date.now();
const EMAIL_A  = `rls_test_a_${TS}@sipo-rls-test.invalid`;
const EMAIL_B  = `rls_test_b_${TS}@sipo-rls-test.invalid`;
const PASSWORD = 'RlsTest!2026';

type CheckResult = { tabla: string; check: string; status: 'PASS' | 'FAIL'; detalle?: string };
const resultados: CheckResult[] = [];

function pass(tabla: string, check: string) {
  resultados.push({ tabla, check, status: 'PASS' });
}

function fail(tabla: string, check: string, detalle: string) {
  resultados.push({ tabla, check, status: 'FAIL', detalle });
}

async function crearUsuario(email: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`No se pudo crear ${email}: ${error?.message}`);
  return data.user;
}

async function clienteAutenticado(email: string) {
  const client = createSupabaseClient(SUPABASE_URL, ANON_KEY);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`Login fallido para ${email}: ${error.message}`);
  return client;
}

async function limpiar(idA: string, idB: string) {
  await admin.auth.admin.deleteUser(idA);
  await admin.auth.admin.deleteUser(idB);
  console.log('\n🧹 Usuarios de prueba eliminados.');
}

async function main() {
  console.log('🔒 Iniciando verificación de RLS de SIPO...\n');

  // ── Crear usuarios de prueba ──────────────────────────────────────────────
  let userA: any, userB: any;
  try {
    userA = await crearUsuario(EMAIL_A);
    userB = await crearUsuario(EMAIL_B);
    console.log(`✓ user_A: ${userA.id.slice(0, 8)}...  user_B: ${userB.id.slice(0, 8)}...`);
  } catch (e: any) {
    console.error('Error creando usuarios:', e.message);
    process.exit(1);
  }

  // ── Insertar datos de user_B via admin (bypasa RLS) ───────────────────────
  const { data: projectB, error: pErr } = await admin.from('projects').insert({
    user_id:    userB.id,
    nombre:     'Proyecto RLS Test B',
    ubicacion:  'Bogotá',
    estado:     'activo',
    tipo_obra:  'residencial',
  }).select().single();
  if (pErr || !projectB) { console.error('No se pudo crear proyecto B:', pErr?.message); await limpiar(userA.id, userB.id); process.exit(1); }

  const { data: budgetB } = await admin.from('budgets').insert({
    user_id:    userB.id,
    project_id: projectB.id,
    titulo:     'Presupuesto RLS Test B',
    estado:     'borrador',
  }).select().single();

  const { data: chapterB } = await admin.from('chapters').insert({
    user_id:   userB.id,
    budget_id: budgetB?.id,
    nombre:    'Capítulo RLS Test B',
    numero:    1,
  }).select().single();

  const { data: activityB } = budgetB && chapterB
    ? await admin.from('activities').insert({
        user_id:         userB.id,
        budget_id:       budgetB.id,
        chapter_id:      chapterB.id,
        nombre:          'Actividad RLS Test B',
        unidad:          'm2',
        cantidad:        10,
        precio_unitario: 5000,
      }).select().single()
    : { data: null };

  const { data: apuB } = activityB && budgetB
    ? await admin.from('apus').insert({
        user_id:     userB.id,
        budget_id:   budgetB.id,
        activity_id: activityB.id,
        rendimiento: 1,
      }).select().single()
    : { data: null };

  const { data: clienteB } = await admin.from('clientes').insert({
    user_id:             userB.id,
    tipo:                'empresa',
    nombre_razon_social: 'Empresa RLS Test B',
  }).select().single();

  console.log('✓ Datos de user_B insertados via admin.\n');

  // ── Autenticar como user_A ────────────────────────────────────────────────
  const cA = await clienteAutenticado(EMAIL_A);
  console.log('✓ Sesión de user_A activa. Ejecutando verificaciones...\n');

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  const { data: rP } = await cA.from('projects').select('id').eq('id', projectB.id);
  rP && rP.length === 0
    ? pass('projects', 'user_A no puede leer proyecto de user_B')
    : fail('projects', 'user_A no puede leer proyecto de user_B', `Devolvió ${rP?.length ?? '?'} filas`);

  const { error: uPErr } = await cA.from('projects').update({ nombre: 'HACK' }).eq('id', projectB.id);
  uPErr
    ? pass('projects', 'user_A no puede modificar proyecto de user_B')
    : fail('projects', 'user_A no puede modificar proyecto de user_B', 'UPDATE no devolvió error');

  const { error: iPErr } = await cA.from('projects').insert({
    user_id: userB.id, nombre: 'HACK', ubicacion: 'X', estado: 'activo',
  });
  iPErr
    ? pass('projects', 'user_A no puede insertar con user_id de user_B')
    : fail('projects', 'user_A no puede insertar con user_id de user_B', 'INSERT aceptó user_id ajeno');

  // ── BUDGETS ───────────────────────────────────────────────────────────────
  if (budgetB) {
    const { data: rB } = await cA.from('budgets').select('id').eq('id', budgetB.id);
    rB && rB.length === 0
      ? pass('budgets', 'user_A no puede leer presupuesto de user_B')
      : fail('budgets', 'user_A no puede leer presupuesto de user_B', `Devolvió ${rB?.length ?? '?'} filas`);

    const { error: uBErr } = await cA.from('budgets').update({ titulo: 'HACK' }).eq('id', budgetB.id);
    uBErr
      ? pass('budgets', 'user_A no puede modificar presupuesto de user_B')
      : fail('budgets', 'user_A no puede modificar presupuesto de user_B', 'UPDATE no devolvió error');
  }

  // ── CHAPTERS ──────────────────────────────────────────────────────────────
  if (chapterB) {
    const { data: rC } = await cA.from('chapters').select('id').eq('id', chapterB.id);
    rC && rC.length === 0
      ? pass('chapters', 'user_A no puede leer capítulo de user_B')
      : fail('chapters', 'user_A no puede leer capítulo de user_B', `Devolvió ${rC?.length ?? '?'} filas`);
  }

  // ── ACTIVITIES ────────────────────────────────────────────────────────────
  if (activityB) {
    const { data: rAct } = await cA.from('activities').select('id').eq('id', activityB.id);
    rAct && rAct.length === 0
      ? pass('activities', 'user_A no puede leer actividad de user_B')
      : fail('activities', 'user_A no puede leer actividad de user_B', `Devolvió ${rAct?.length ?? '?'} filas`);
  }

  // ── APUS ──────────────────────────────────────────────────────────────────
  if (apuB) {
    const { data: rApu } = await cA.from('apus').select('id').eq('id', apuB.id);
    rApu && rApu.length === 0
      ? pass('apus', 'user_A no puede leer APU de user_B')
      : fail('apus', 'user_A no puede leer APU de user_B', `Devolvió ${rApu?.length ?? '?'} filas`);
  }

  // ── CLIENTES ──────────────────────────────────────────────────────────────
  if (clienteB) {
    const { data: rCl } = await cA.from('clientes').select('id').eq('id', clienteB.id);
    rCl && rCl.length === 0
      ? pass('clientes', 'user_A no puede leer cliente de user_B')
      : fail('clientes', 'user_A no puede leer cliente de user_B', `Devolvió ${rCl?.length ?? '?'} filas`);

    const { error: uClErr } = await cA
      .from('clientes')
      .update({ nombre_razon_social: 'HACK' })
      .eq('id', clienteB.id);
    uClErr
      ? pass('clientes', 'user_A no puede modificar cliente de user_B')
      : fail('clientes', 'user_A no puede modificar cliente de user_B', 'UPDATE no devolvió error');

    const { error: iClErr } = await cA.from('clientes').insert({
      user_id: userB.id, tipo: 'empresa', nombre_razon_social: 'HACK',
    });
    iClErr
      ? pass('clientes', 'user_A no puede insertar cliente con user_id de user_B')
      : fail('clientes', 'user_A no puede insertar cliente con user_id de user_B', 'INSERT aceptó user_id ajeno');
  }

  // ── APU_ITEMS (lectura cruzada) ────────────────────────────────────────────
  if (apuB) {
    const { data: rItems } = await cA.from('apu_items').select('id').eq('apu_id', apuB.id).limit(1);
    rItems && rItems.length === 0
      ? pass('apu_items', 'user_A no puede leer apu_items de user_B')
      : fail('apu_items', 'user_A no puede leer apu_items de user_B', `Devolvió ${rItems?.length ?? '?'} filas`);
  }

  // ── Reporte final ─────────────────────────────────────────────────────────
  const fallas = resultados.filter(r => r.status === 'FAIL');
  console.log('══════════════════════════════════════════════════════');
  console.log('  RESULTADOS VERIFICACIÓN RLS — SIPO');
  console.log('══════════════════════════════════════════════════════');
  for (const r of resultados) {
    const icono = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${icono}  [${r.tabla}] ${r.check}`);
    if (r.detalle) console.log(`         → ${r.detalle}`);
  }
  console.log('──────────────────────────────────────────────────────');
  console.log(`Total: ${resultados.length} checks — ${resultados.length - fallas.length} PASS, ${fallas.length} FAIL`);
  if (fallas.length > 0) {
    console.log('\n⚠️  Hay fallas de RLS. Revisar las políticas en Supabase Dashboard → Authentication → Policies.');
  } else {
    console.log('\n🎉 Todos los checks pasaron. El aislamiento RLS está funcionando correctamente.');
  }

  await limpiar(userA.id, userB.id);
  process.exit(fallas.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Error inesperado:', e);
  process.exit(1);
});
