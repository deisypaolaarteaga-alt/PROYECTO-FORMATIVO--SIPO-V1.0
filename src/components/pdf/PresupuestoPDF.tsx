import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';
import Decimal from 'decimal.js';
import { formatDate } from '@/lib/utils';
import { formatearCOP } from '@/lib/utils/formato-cop';
import type { PresupuestoPDFData, ConfigPDFProfesional, PDFExportOptions } from '@/types/pdf';

const formatNIT = (nit: string) => {
  if (!nit) return nit;
  if (/^\d{3}\.\d{3}\.\d{3}-\d$/.test(nit)) return nit;
  const d = nit.replace(/\D/g, '');
  if (d.length >= 10) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d[9]}`;
  return nit;
};

// Dimensiones Carta: 612 x 792
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 50,
    paddingBottom: 60,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  
  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1C2B3A',
    paddingBottom: 15,
  },
  logoContainer: {
    width: 120,
    maxHeight: 60,
  },
  logoImage: {
    objectFit: 'contain',
    maxHeight: 60,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C2B3A',
  },
  companyInfo: {
    alignItems: 'flex-end',
    width: '60%',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C2B3A',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#333333',
    textAlign: 'right',
    lineHeight: 1.4,
  },

  // Datos del Proyecto
  projectSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E2DDD6',
    borderRadius: 4,
  },
  projectRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  projectLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#1C2B3A',
    fontSize: 9,
  },
  projectValue: {
    flex: 1,
    fontSize: 9,
  },

  // Título de la tabla
  tableTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C2B3A',
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  // Tablas
  table: {
    display: 'flex',
    width: 'auto',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1C2B3A',
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    minHeight: 20,
  },
  tableRowAlternate: {
    backgroundColor: '#fafafa',
  },
  chapterSubtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#E2DDD6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  chapterSubtotalText: {
    fontWeight: 'bold',
    color: '#1C2B3A',
    fontSize: 9,
  },

  // Columnas Tabla (Total 100%)
  colN: { width: '7%', textAlign: 'center' },
  colDesc: { width: '38%' },
  colUnd: { width: '10%', textAlign: 'center' },
  colCant: { width: '10%', textAlign: 'center' },
  colVrUnit: { width: '13%', textAlign: 'right' },
  colVrTotal: { width: '13%', textAlign: 'right' },
  colPctCD: { width: '9%', textAlign: 'right' },

  // Resumen Financiero
  summarySection: {
    marginTop: 10,
    alignSelf: 'flex-end',
    width: '50%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#333333',
  },
  summaryValue: {
    fontSize: 9,
    textAlign: 'right',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#1C2B3A',
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1C2B3A',
  },
  summaryTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#1C2B3A',
  },
  ivaNota: {
    fontSize: 7,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
  },

  // Retenciones
  retencionesSection: {
    marginTop: 30,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    borderRadius: 4,
  },
  retencionesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1C2B3A',
    marginBottom: 6,
  },
  retencionesDisclaimer: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  netoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1C2B3A',
    backgroundColor: '#E2DDD6',
    paddingHorizontal: 8,
  },
  
  // Firmas
  signatureSection: {
    marginTop: 50,
  },
  signatureIntro: {
    fontSize: 8,
    color: '#555555',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 1.5,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '44%',
    borderTopWidth: 1.5,
    borderTopColor: '#1C2B3A',
    paddingTop: 10,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 3,
    textAlign: 'center',
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1C2B3A',
    marginBottom: 3,
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 2,
  },

  // Pie de página
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2DDD6',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#666666',
  },
});

interface Props {
  budget: PresupuestoPDFData;
  profile: ConfigPDFProfesional;
  options?: PDFExportOptions;
  children?: React.ReactNode;
}

export const PresupuestoPDF = ({ budget, profile, options, children }: Props) => {
  // === Cálculos con Decimal.js (precisión financiera) ===
  const D = (v: number | string | null | undefined) => new Decimal(Number(v) || 0);

  const costoDirecto = (budget.chapters || []).reduce((sum, ch) => {
    const chTotal = (ch.activities || []).reduce(
      (s, a) => s.plus(D(a.cantidad).times(D(a.precio_unitario))),
      new Decimal(0)
    );
    return sum.plus(chTotal);
  }, new Decimal(0));

  // Porcentajes AIU (guardados como números para texto de etiquetas)
  const adminPct  = Number(budget.administracion_pct) || 0;
  const imprevPct = Number(budget.imprevistos_pct)    || 0;
  const utilPct   = Number(budget.utilidad_pct)       || 0;

  const aiuAdmin       = costoDirecto.times(adminPct).dividedBy(100);
  const aiuImprevistos = costoDirecto.times(imprevPct).dividedBy(100);
  const aiuUtilidad    = costoDirecto.times(utilPct).dividedBy(100);
  const aiuTotal       = aiuAdmin.plus(aiuImprevistos).plus(aiuUtilidad);
  const subtotal       = costoDirecto.plus(aiuTotal);

  // IVA — respeta metodo_iva del presupuesto
  const ivaPct = Number(budget.iva_porcentaje) || 19;
  let iva = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': iva = aiuUtilidad.times(ivaPct).dividedBy(100); break;
    case 'sobre_aiu':      iva = aiuTotal.times(ivaPct).dividedBy(100);    break;
    case 'sobre_total':    iva = subtotal.times(ivaPct).dividedBy(100);    break;
    default:               iva = new Decimal(0); // no_aplica
  }

  const totalGeneral = subtotal.plus(iva);

  // Retenciones — usa null-check para distinguir "0% explícito" de campo vacío
  const reteFuentePct = budget.retefuente_pct != null ? Number(budget.retefuente_pct) : 2;
  const icaPct        = budget.ica_pct        != null ? Number(budget.ica_pct)        : 0.414;
  const reteivaPct    = budget.reteiva_pct    != null ? Number(budget.reteiva_pct)    : 0;

  const reteFuente = subtotal.times(reteFuentePct).dividedBy(100);
  const reteIca    = subtotal.times(icaPct).dividedBy(100);
  const reteIva    = iva.times(reteivaPct).dividedBy(100);
  const totalRetenciones = reteFuente.plus(reteIca).plus(reteIva);
  const valorNeto = totalGeneral.minus(totalRetenciones);

  // Helper formato moneda: acepta Decimal o number
  const fmtD = (val: Decimal) => formatearCOP(val.toDecimalPlaces(0).toNumber());
  const formatoCOP = (val: number) => formatearCOP(Math.round(val));
  
  const fechaEmision = new Date();
  const fechaValidez = new Date();
  fechaValidez.setDate(fechaEmision.getDate() + (options?.vigencia || budget.vigencia_dias || 30));

  return (
    <Document author={profile.nombre_completo || 'SIPO'} title={`Presupuesto - ${budget.titulo}`}>
      <Page size="LETTER" style={styles.page}>
        
        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {profile.logo_url ? (
              <Image src={profile.logo_url} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoText}>{profile.empresa || profile.nombre_completo || 'PRESUPUESTO'}</Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{profile.empresa || profile.nombre_completo || 'Profesional de Construcción'}</Text>
            {profile.nit && <Text style={styles.companyDetails}>NIT: {formatNIT(profile.nit)}</Text>}
            <Text style={styles.companyDetails}>
              {profile.regimen_tributario === 'responsable_iva' ? 'Responsable de IVA' : 'No responsable de IVA - Art. 437 E.T.'}
            </Text>
            {profile.matricula_profesional && <Text style={styles.companyDetails}>Matrícula Profesional: {profile.matricula_profesional}</Text>}
            <Text style={styles.companyDetails}>{profile.ciudad || 'Colombia'} - {formatDate(fechaEmision.toISOString())}</Text>
          </View>
        </View>

        {/* Datos del Proyecto */}
        <View style={styles.projectSection}>
          <View style={styles.projectRow}>
            <Text style={styles.projectLabel}>Proyecto:</Text>
            <Text style={styles.projectValue}>{budget.projects?.nombre || 'No especificado'}</Text>
          </View>
          <View style={styles.projectRow}>
            <Text style={styles.projectLabel}>Ubicación:</Text>
            <Text style={styles.projectValue}>{budget.projects?.ubicacion || 'No especificada'}</Text>
          </View>
          <View style={styles.projectRow}>
            <Text style={styles.projectLabel}>Cliente:</Text>
            <Text style={styles.projectValue}>
              {options?.clienteNombre || 
               (budget.projects as any)?.clientes?.nombre_razon_social || 
               (budget.projects as any)?.cliente_nombre || 
               'No especificado'}
            </Text>
          </View>
          {(budget.projects as any)?.clientes?.nit_cedula && (
            <View style={styles.projectRow}>
              <Text style={styles.projectLabel}>NIT/Cédula:</Text>
              <Text style={styles.projectValue}>{(budget.projects as any).clientes.nit_cedula}</Text>
            </View>
          )}
          <View style={styles.projectRow}>
            <Text style={styles.projectLabel}>Válido hasta:</Text>
            <Text style={styles.projectValue}>{formatDate(fechaValidez.toISOString())}</Text>
          </View>
          <View style={styles.projectRow}>
            <Text style={styles.projectLabel}>No. Presupuesto:</Text>
            <Text style={styles.projectValue}>{budget.numero_presupuesto || budget.id.split('-')[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Tabla de Capítulos y Actividades */}
        <Text style={styles.tableTitle}>Detalle de Presupuesto</Text>
        <View style={styles.table}>
          {/* Header de Tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colN]}>N°</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnd]}>Unidad</Text>
            <Text style={[styles.tableHeaderCell, styles.colCant]}>Cantidad</Text>
            <Text style={[styles.tableHeaderCell, styles.colVrUnit]}>Vr. Unitario</Text>
            <Text style={[styles.tableHeaderCell, styles.colVrTotal]}>Vr. Total</Text>
            <Text style={[styles.tableHeaderCell, styles.colPctCD]}>% C.D.</Text>
          </View>

          {/* Filas */}
          {(budget.chapters || [])
            .slice()
            .sort((a, b) => (Number((a as any).orden) || Number(a.numero) || 0) - (Number((b as any).orden) || Number(b.numero) || 0))
            .map((ch, i) => {
            const sortedActivities = (ch.activities || [])
              .slice()
              .sort((a, b) => (Number((a as any).orden) || 0) - (Number((b as any).orden) || 0));
            const chSubtotal = sortedActivities.reduce(
              (s, a) => s.plus(D(a.cantidad).times(D(a.precio_unitario))),
              new Decimal(0)
            );
            const actT = chSubtotal.toDecimalPlaces(0).toNumber();
            const pctCD = costoDirecto.greaterThan(0)
              ? chSubtotal.dividedBy(costoDirecto).times(100).toDecimalPlaces(1).toNumber()
              : null;

            return (
              <React.Fragment key={ch.id || i}>
                {sortedActivities.map((act, j) => {
                  const vrUnit = Number(act.precio_unitario) || 0;
                  const cant = Number(act.cantidad) || 0;
                  const vrTotal = vrUnit * cant;
                  const pctCDAct = costoDirecto.greaterThan(0)
                    ? D(vrTotal).dividedBy(costoDirecto).times(100).toDecimalPlaces(1).toNumber()
                    : null;
                  return (
                    <View key={act.id || j} style={[styles.tableRow, j % 2 === 1 ? styles.tableRowAlternate : {}]}>
                      <Text style={[styles.colN, { fontSize: 8 }]}>{ch.numero}.{j + 1}</Text>
                      <Text style={[styles.colDesc, { fontSize: 8 }]}>{act.nombre}</Text>
                      <Text style={[styles.colUnd, { fontSize: 8 }]}>{act.unidad}</Text>
                      <Text style={[styles.colCant, { fontSize: 8 }]}>{cant}</Text>
                      <Text style={[styles.colVrUnit, { fontSize: 8 }]}>{formatoCOP(vrUnit)}</Text>
                      <Text style={[styles.colVrTotal, { fontSize: 8 }]}>{formatoCOP(vrTotal)}</Text>
                      <Text style={[styles.colPctCD, { fontSize: 8 }]}>
                        {pctCDAct !== null ? `${pctCDAct.toFixed(1)}%` : '—'}
                      </Text>
                    </View>
                  );
                })}
                
                {/* Subtotal del Capítulo */}
                <View style={styles.chapterSubtotalRow}>
                  <Text style={[styles.chapterSubtotalText, { width: '78%', textAlign: 'right', paddingRight: 10 }]}>
                    Subtotal Capítulo {ch.numero} - {ch.nombre}
                  </Text>
                  <Text style={[styles.chapterSubtotalText, styles.colVrTotal]}>
                    {formatoCOP(actT)}
                  </Text>
                  <Text style={[styles.chapterSubtotalText, styles.colPctCD]}>
                    {pctCD !== null ? `${pctCD.toFixed(1)}%` : '—'}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Resumen Financiero */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Costo Directo:</Text>
            <Text style={[styles.summaryValue, { fontWeight: 'bold' }]}>{fmtD(costoDirecto)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Administración ({adminPct}%)</Text>
            <Text style={styles.summaryValue}>{fmtD(aiuAdmin)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Imprevistos ({imprevPct}%)</Text>
            <Text style={styles.summaryValue}>{fmtD(aiuImprevistos)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Utilidad ({utilPct}%)</Text>
            <Text style={styles.summaryValue}>{fmtD(aiuUtilidad)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#1C2B3A' }]}>SUBTOTAL (CD + AIU):</Text>
            <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#1C2B3A' }]}>{fmtD(subtotal)}</Text>
          </View>

          {/* IVA — siempre visible */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {budget.metodo_iva === 'no_aplica' || !budget.metodo_iva
                ? 'IVA'
                : `IVA (${ivaPct}%${
                    budget.metodo_iva === 'sobre_utilidad' ? ' s/Utilidad' :
                    budget.metodo_iva === 'sobre_aiu'      ? ' s/AIU'      :
                    budget.metodo_iva === 'sobre_total'    ? ' s/Total'    : ''
                  })`
              }
            </Text>
            <Text style={styles.summaryValue}>
              {budget.metodo_iva === 'no_aplica' || !budget.metodo_iva
                ? 'No aplica'
                : fmtD(iva)
              }
            </Text>
          </View>
          {budget.metodo_iva === 'sobre_utilidad' && (
            <Text style={styles.ivaNota}>* IVA sobre la Utilidad — Ley 1819 de 2016, Art. 468-3</Text>
          )}

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>TOTAL GENERAL:</Text>
            <Text style={styles.summaryTotalValue}>{fmtD(totalGeneral)}</Text>
          </View>
        </View>

        {/* Retenciones Informativas — respeta mostrar_retenciones del presupuesto */}
        {options?.incluirRetenciones !== false && budget.mostrar_retenciones !== false && (
          <View style={styles.retencionesSection} wrap={false}>
            <Text style={styles.retencionesTitle}>Retenciones Informativas</Text>
            <Text style={styles.retencionesDisclaimer}>
              Las siguientes retenciones son responsabilidad del contratante y se presentan con fines informativos. No afectan el valor total del contrato.
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ReteFuente ({reteFuentePct.toFixed(1)}%)</Text>
              <Text style={styles.summaryValue}>- {fmtD(reteFuente)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ReteICA ({icaPct.toFixed(3)}%)</Text>
              <Text style={styles.summaryValue}>- {fmtD(reteIca)}</Text>
            </View>
            {reteivaPct > 0 && iva.greaterThan(0) && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ReteIVA ({reteivaPct.toFixed(0)}% del IVA)</Text>
                <Text style={styles.summaryValue}>- {fmtD(reteIva)}</Text>
              </View>
            )}

            <View style={styles.netoRow}>
              <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#1C2B3A' }]}>VALOR NETO A GIRAR (Informativo):</Text>
              <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#1C2B3A' }]}>{fmtD(valorNeto)}</Text>
            </View>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.signatureIntro}>
            El presente presupuesto ha sido elaborado con base en precios del mercado colombiano vigentes.{'\n'}
            La aceptación de este documento implica conformidad con el alcance, cantidades y condiciones técnicas descritas.
          </Text>
          <View style={styles.signatureRow}>
            <View style={{ width: '44%', alignItems: 'center' }}>
              <View style={{ height: 48, marginBottom: 4, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
                {profile.firma_url ? (
                  <Image src={profile.firma_url} style={{ height: 44, objectFit: 'contain' }} />
                ) : null}
              </View>
              <View style={{ borderTopWidth: 1.5, borderTopColor: '#1C2B3A', width: '100%', paddingTop: 10, alignItems: 'center' }}>
                <Text style={styles.signatureName}>
                  {profile.nombre_completo || '[Nombre no configurado]'}
                </Text>
                {(profile.cargo_firma || profile.profesion) && (
                  <Text style={styles.signatureRole}>{profile.cargo_firma ?? profile.profesion}</Text>
                )}
                <Text style={styles.signatureRole}>{profile.empresa || 'Contratista'}</Text>
                <Text style={[styles.signatureRole, { marginTop: 4 }]}>Elaboró y Presentó</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureName}>
                {options?.clienteNombre ||
                 (budget.projects as any)?.clientes?.nombre_contacto ||
                 (budget.projects as any)?.clientes?.nombre_razon_social ||
                 (budget.projects as any)?.cliente_nombre ||
                 'Cliente / Contratante'}
              </Text>
              {(budget.projects as any)?.clientes?.cargo_contacto && (
                <Text style={styles.signatureRole}>
                  {(budget.projects as any).clientes.cargo_contacto}
                </Text>
              )}
              {(budget.projects as any)?.clientes?.nit_cedula && (
                <Text style={styles.signatureRole}>
                  NIT/C.C. {(budget.projects as any).clientes.nit_cedula}
                </Text>
              )}
              <Text style={[styles.signatureRole, { marginTop: 4 }]}>Aceptó y Firmó</Text>
            </View>
          </View>
        </View>

        {/* Pie de Página */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Presupuesto elaborado con SIPO — Sistema Inteligente de Presupuestos de Obra | Este documento no constituye factura de venta</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
      
      {/* Hojas Adicionales (APUs, Anexos, etc) */}
      {children}
    </Document>
  );
};
