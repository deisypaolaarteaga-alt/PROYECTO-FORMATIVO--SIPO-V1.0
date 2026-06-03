#!/usr/bin/env node

/**
 * SIPO Migration Runner — con tracking de migraciones
 *
 * Crea la tabla `schema_migrations` en la primera ejecución y
 * registra cada archivo SQL aplicado. Las migraciones ya registradas
 * se saltan automáticamente, por lo que el comando es seguro de
 * ejecutar múltiples veces (idempotente).
 */

const fs   = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ─── Variables de entorno ──────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword  = process.env.SUPABASE_DB_PASSWORD;
const dbHostEnv   = process.env.SUPABASE_DB_HOST;
const dbPortEnv   = process.env.SUPABASE_DB_PORT;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Falta SUPABASE_DB_PASSWORD en .env\n');
  console.error('  La contraseña de la BD ≠ Service Role Key.');
  console.error('  Ubícala en: Supabase Dashboard → Project Settings → Database → Database password\n');
  console.error('  Si la red bloquea el puerto 5432 (caso común), usa el Pooler:');
  console.error('    SUPABASE_DB_HOST=aws-0-REGION.pooler.supabase.com');
  console.error('    SUPABASE_DB_PORT=6543');
  process.exit(1);
}

// ─── Cadena de conexión ───────────────────────────────────────────────────────
const projectId = new URL(supabaseUrl).hostname.split('.')[0];
const dbHost    = dbHostEnv || `db.${projectId}.supabase.co`;
const dbPort    = dbPortEnv || '5432';
// Pooler usa "postgres.PROJECT_ID" como usuario; conexión directa usa "postgres"
const dbUser    = dbHostEnv ? `postgres.${projectId}` : 'postgres';

const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;

// ─── Lista de migraciones en orden ───────────────────────────────────────────
// Agregar nuevos archivos AL FINAL — nunca reordenar los existentes.
const migrationFiles = [
  'schema.sql',
  'supabase/migrations/20260504103000_parametros_fiscales.sql',
  'supabase/migrations/20260504103500_profiles_fiscal.sql',
  'supabase/migrations/20260504104000_rls_audit.sql',
  'supabase/migrations/20260504104500_budget_estados.sql',
  'supabase/migrations/20260504105000_ia_security.sql',
  'supabase/migrations/20260505100000_catalogo_actividades.sql',
  'supabase/migrations/20260505200000_budget_columns_completo.sql',
  'supabase/migrations/20260505210000_pendientes_motor.sql',
  'supabase/migrations/20260505220000_catalogo_apu_items.sql',
  'supabase/migrations/20260506100000_fix_v_resumen_retenciones.sql',
  'supabase/migrations/20260507100000_fix_trigger_chain.sql',
  'supabase/migrations/20260510100000_profiles_contacto.sql',
  'supabase/migrations/20260511100000_drop_legacy_users.sql',
  'supabase/migrations/20260511110000_fix_apu_costo_precision.sql',
  'supabase/migrations/20260511120000_seed_trabajadores.sql',
  'supabase/migrations/20260511130000_estados_proyecto_presupuesto.sql',
  'supabase/migrations/20260511140000_fix_estados_proyecto.sql',
  'supabase/migrations/20260512100000_seed_institucional.sql',
  'supabase/migrations/20260512110000_seed_industrial.sql',
  'supabase/migrations/20260512120000_seed_hotelero.sql',
  'supabase/migrations/20260512130000_seed_apu_items_nuevos_tipos.sql',
  'supabase/migrations/20260512140000_add_hotelero_tipo_obra.sql',
  'supabase/migrations/20260512150000_strip_chapter_number_prefix.sql',
  'supabase/migrations/20260512200000_apu_items_cuadrilla.sql',
  'supabase/migrations/20260512210000_fix_catalogo_apu_precios.sql',
  'supabase/migrations/20260512210001_fix_catalogo_apu_precios_v2.sql',
  'supabase/migrations/20260512210002_fix_catalogo_apu_precios_v3.sql',
  'supabase/migrations/20260512300000_clientes.sql',
  'supabase/migrations/20260514100000_fix_audit_log_rls.sql',
  'supabase/migrations/20260516100000_update_trabajadores_2026.sql',
  'supabase/migrations/20260516200000_proveedores.sql',
  'supabase/migrations/20260516300000_fix_materials_duplicados.sql',
  'supabase/migrations/20260517100000_budget_aprobacion.sql',
  'supabase/migrations/20260517200000_drop_legacy_estado_check.sql',
  'supabase/migrations/20260519100000_seed_cuadrillas_base.sql',
  'supabase/migrations/20260519110000_fix_cuadrillas_trabajadores.sql',
  'supabase/migrations/20260520100000_security_rls_audit.sql',
  'supabase/migrations/20260521100000_fn_duplicar_presupuesto.sql',
  'supabase/migrations/20260522100000_seed_municipios_completo.sql',
  'supabase/migrations/20260526100000_trabajadores_usuario.sql',
  'supabase/migrations/20260527100000_user_precios_insumos.sql',
  'supabase/migrations/20260527200000_insumos_activo.sql',
  'supabase/migrations/20260601100000_roles_usuario.sql',
  'supabase/migrations/20260601110000_fix_rol_default.sql',
  'supabase/migrations/20260601120000_proveedores_activo.sql',
  'supabase/migrations/20260601200000_user_plantillas.sql',
  'supabase/migrations/20260601300000_activities_catalogo_ref.sql',
  'supabase/migrations/20260601400000_plantillas_tipo_obra.sql',
  'supabase/migrations/20260602100000_eliminar_archivar_proyectos_presupuestos.sql',
  'supabase/migrations/20260602200000_profiles_tipo_persona.sql',
  'supabase/migrations/20260602300000_fix_security_advisor.sql',
  'supabase/migrations/20260603100000_portal_cliente.sql',
  'supabase/migrations/20260603200000_clientes_unique.sql',
  'supabase/migrations/20260603210000_clientes_drop_nombre_unique.sql',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL      PRIMARY KEY,
      filename   TEXT        NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations ORDER BY id');
  return new Set(rows.map(r => r.filename));
}

async function markApplied(client, filename) {
  await client.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
    [filename]
  );
}

async function runFile(client, filePath) {
  const fullPath = path.join(__dirname, '../', filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️  Archivo no encontrado — saltando: ${filePath}`);
    return 'not_found';
  }

  const sql = fs.readFileSync(fullPath, 'utf-8');
  await client.query(sql);
  return 'ok';
}

// ─── Runner principal ──────────────────────────────────────────────────────────

async function runMigrations() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   SIPO SQL Migration Runner  (con tracking)  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  console.log(`  Host : ${dbHost}:${dbPort}`);
  console.log(`  User : ${dbUser}`);
  console.log(`  Mode : ${dbHostEnv ? 'Pooler (Transaction)' : 'Directo'}\n`);

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    process.stdout.write('🔗 Conectando a PostgreSQL... ');
    await client.connect();
    console.log('✅\n');

    // Crear tabla de tracking si no existe
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);

    if (applied.size > 0) {
      console.log(`📋 Migraciones ya aplicadas: ${applied.size}`);
      applied.forEach(f => console.log(`   ✓ ${f}`));
      console.log('');
    }

    // Estadísticas
    let countSkipped  = 0;
    let countApplied  = 0;
    let countErrors   = 0;

    for (const file of migrationFiles) {
      // ── Saltar si ya está registrada ──
      if (applied.has(file)) {
        console.log(`⏭️  SKIP   ${file}`);
        countSkipped++;
        continue;
      }

      process.stdout.write(`🔄 APPLY  ${file} ... `);

      try {
        const result = await runFile(client, file);

        if (result === 'not_found') {
          countSkipped++;
          continue;
        }

        await markApplied(client, file);
        console.log('✅');
        countApplied++;

      } catch (err) {
        console.log('❌');
        console.error(`\n   Error: ${err.message}`);
        console.error('   Corrige el archivo SQL y vuelve a ejecutar npm run migrate.\n');
        countErrors++;
        // Detener en el primer error para no corromper el estado
        break;
      }
    }

    // ── Resumen ──
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║                  RESUMEN                     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`  ✅ Aplicadas  : ${countApplied}`);
    console.log(`  ⏭️  Saltadas   : ${countSkipped}`);
    console.log(`  ❌ Errores    : ${countErrors}`);

    if (countErrors === 0) {
      console.log('\n🎉 Base de datos actualizada correctamente.\n');
    } else {
      console.log('\n⚠️  Revisa el error antes de continuar.\n');
    }

    process.exit(countErrors > 0 ? 1 : 0);

  } catch (err) {
    console.error('\n❌ Error de conexión a PostgreSQL:');
    console.error(`   ${err.message}`);
    console.error(`   Cadena: postgres://${dbUser}:***@${dbHost}:${dbPort}/postgres\n`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
