import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatearCOP } from '@/lib/utils/formato-cop';
import type { Activity, ConfigAIU } from '@/types';
import type { ParametrosFiscales } from '@/types/pdf';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1C2B3A',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C2B3A',
    marginBottom: 6,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontWeight: 'bold',
    color: '#1C2B3A',
    fontSize: 9,
  },
  value: {
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: 9,
  },
  
  // Tablas
  section: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#E2DDD6',
    color: '#1C2B3A',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  table: {
    display: 'flex',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2DDD6',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1C2B3A',
    color: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 18,
    alignItems: 'center',
  },
  tableRowAlternate: {
    backgroundColor: '#fafafa',
  },
  colDesc: { width: '40%' },
  colUnd: { width: '15%', textAlign: 'center' },
  colCant: { width: '15%', textAlign: 'right' },
  colVrUnit: { width: '15%', textAlign: 'right' },
  colVrTotal: { width: '15%', textAlign: 'right' },

  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#E2DDD6',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  subtotalLabel: {
    width: '85%',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#1C2B3A',
    paddingRight: 8,
  },
  subtotalValue: {
    width: '15%',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#1C2B3A',
  },

  // Resumen final APU
  summarySection: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '50%',
    borderWidth: 1,
    borderColor: '#1C2B3A',
    padding: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1C2B3A',
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#1C2B3A',
  },
  
  notaReferencia: {
    marginTop: 8,
    paddingTop: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2DDD6',
    fontSize: 7,
    color: '#888888',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2DDD6',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#666666',
    fontStyle: 'italic',
  },
});

interface Props {
  projectName: string;
  activity: Activity;
  configAiu?: ConfigAIU; // Por si hay AIU a nivel de APU, aunque en algunos contratos se suma al final, pero se pide mostrarlo.
  parametros?: ParametrosFiscales;
  chapterNumber: number;
  activityIndex?: number; // Índice secuencial 1-based; si se provee, reemplaza activity.numero
}

export const APUDetallePDF = ({ projectName, activity, parametros, chapterNumber, activityIndex }: Props) => {
  const apu = activity.apu;
  if (!apu) return null; // No renderizar hoja vacía si no hay APU

  const formatoCOP = (val: number) => formatearCOP(Math.round(val));

  const itemsMaterial = activity.apu_items?.filter(i => i.tipo === 'material') || [];
  const itemsMO = activity.apu_items?.filter(i => i.tipo === 'mano_obra') || [];
  const itemsEquipo = activity.apu_items?.filter(i => i.tipo === 'equipo') || [];

  const subtotalMat = itemsMaterial.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const subtotalMO = itemsMO.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const subtotalEq = itemsEquipo.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  // Cálculos HM y EPP según referencia colombiana
  const pctHM = apu.pct_herramienta_menor ?? (parametros?.herramienta_menor_porcentaje || 3);
  const pctEPP = apu.pct_epp ?? (parametros?.epp_porcentaje || 1);
  const costoHM = subtotalMO * (pctHM / 100);
  const costoEPP = subtotalMO * (pctEPP / 100);

  const costoDirectoUnitario = apu.costo_total;

  // Numeración dinámica de secciones — solo se incrementa si la sección existe
  let sectionNum = 0;

  // Detecta si algún ítem tiene nombre genérico (importado del catálogo sin editar)
  const tieneItemsGenericos = [...itemsEquipo, ...itemsMaterial, ...itemsMO].some(
    item => /actividad general|sin definir|por definir/i.test(item.nombre || '')
  );

  return (
    <Page size="LETTER" style={styles.page} wrap={false} break>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>ANÁLISIS DE PRECIOS UNITARIOS (APU)</Text>
        <View style={styles.projectRow}>
          <Text style={styles.label}>Proyecto:</Text>
          <Text style={styles.value}>{projectName}</Text>
        </View>
        <View style={styles.projectRow}>
          <Text style={styles.label}>Ítem:</Text>
          <Text style={styles.value}>{chapterNumber}.{activityIndex ?? activity.numero}</Text>
        </View>
        <View style={styles.projectRow}>
          <Text style={styles.label}>Descripción:</Text>
          <Text style={styles.value}>{activity.nombre}</Text>
        </View>
        <View style={styles.projectRow}>
          <Text style={styles.label}>Unidad:</Text>
          <Text style={styles.value}>{activity.unidad}</Text>
        </View>
        <View style={styles.projectRow}>
          <Text style={styles.label}>Rendimiento:</Text>
          <Text style={styles.value}>{apu.rendimiento} {activity.unidad}/día</Text>
        </View>
        <View style={styles.projectRow}>
          <Text style={styles.label}>Metodología:</Text>
          <Text style={styles.value}>Referencia mercado colombiano (Divisor APU: {parametros?.divisor_apu || 182}h)</Text>
        </View>
      </View>

      {/* Equipos */}
      {itemsEquipo.length > 0 && (() => { sectionNum++; return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionNum}. EQUIPOS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Descripción</Text>
              <Text style={[styles.colUnd, { fontWeight: 'bold' }]}>Unidad</Text>
              <Text style={[styles.colCant, { fontWeight: 'bold' }]}>Cantidad</Text>
              <Text style={[styles.colVrUnit, { fontWeight: 'bold' }]}>Tarifa</Text>
              <Text style={[styles.colVrTotal, { fontWeight: 'bold' }]}>Costo Unitario</Text>
            </View>
            {itemsEquipo.map((item, i) => (
              <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlternate : {}]}>
                <Text style={styles.colDesc}>{item.nombre}</Text>
                <Text style={styles.colUnd}>{item.unidad}</Text>
                <Text style={styles.colCant}>{item.cantidad}</Text>
                <Text style={styles.colVrUnit}>{formatoCOP(item.precio_unitario)}</Text>
                <Text style={styles.colVrTotal}>{formatoCOP(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal Equipos:</Text>
              <Text style={styles.subtotalValue}>{formatoCOP(subtotalEq)}</Text>
            </View>
          </View>
        </View>
      ); })()}

      {/* Materiales */}
      {itemsMaterial.length > 0 && (() => { sectionNum++; return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionNum}. MATERIALES</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Descripción</Text>
              <Text style={[styles.colUnd, { fontWeight: 'bold' }]}>Unidad</Text>
              <Text style={[styles.colCant, { fontWeight: 'bold' }]}>Cantidad</Text>
              <Text style={[styles.colVrUnit, { fontWeight: 'bold' }]}>Precio Unit.</Text>
              <Text style={[styles.colVrTotal, { fontWeight: 'bold' }]}>Costo Unitario</Text>
            </View>
            {itemsMaterial.map((item, i) => (
              <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlternate : {}]}>
                <Text style={styles.colDesc}>{item.nombre}</Text>
                <Text style={styles.colUnd}>{item.unidad}</Text>
                <Text style={styles.colCant}>{item.cantidad}</Text>
                <Text style={styles.colVrUnit}>{formatoCOP(item.precio_unitario)}</Text>
                <Text style={styles.colVrTotal}>{formatoCOP(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal Materiales:</Text>
              <Text style={styles.subtotalValue}>{formatoCOP(subtotalMat)}</Text>
            </View>
          </View>
        </View>
      ); })()}

      {/* Mano de Obra */}
      {itemsMO.length > 0 && (() => { sectionNum++; return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionNum}. MANO DE OBRA</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Cargo</Text>
              <Text style={[styles.colUnd, { fontWeight: 'bold' }]}>Unidad</Text>
              <Text style={[styles.colCant, { fontWeight: 'bold' }]}>Cantidad</Text>
              <Text style={[styles.colVrUnit, { fontWeight: 'bold' }]}>Jornal Total</Text>
              <Text style={[styles.colVrTotal, { fontWeight: 'bold' }]}>Costo Unitario</Text>
            </View>
            {itemsMO.map((item, i) => (
              <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlternate : {}]}>
                <Text style={styles.colDesc}>{item.nombre}</Text>
                <Text style={styles.colUnd}>{item.unidad}</Text>
                <Text style={styles.colCant}>{item.cantidad}</Text>
                <Text style={styles.colVrUnit}>{formatoCOP(item.precio_unitario)}</Text>
                <Text style={styles.colVrTotal}>{formatoCOP(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal Mano de Obra:</Text>
              <Text style={styles.subtotalValue}>{formatoCOP(subtotalMO)}</Text>
            </View>
            <View style={styles.subtotalRow}>
              <Text style={[styles.subtotalLabel, { color: '#666' }]}>Herramienta Menor ({pctHM}% sobre MO):</Text>
              <Text style={[styles.subtotalValue, { color: '#666' }]}>{formatoCOP(costoHM)}</Text>
            </View>
            <View style={styles.subtotalRow}>
              <Text style={[styles.subtotalLabel, { color: '#666' }]}>Elementos Seg. Ind. (EPP) ({pctEPP}% sobre MO):</Text>
              <Text style={[styles.subtotalValue, { color: '#666' }]}>{formatoCOP(costoEPP)}</Text>
            </View>
          </View>
        </View>
      ); })()}

      {/* Nota aclaratoria — precios de referencia */}
      {tieneItemsGenericos && (
        <Text style={styles.notaReferencia}>
          * Algunos ítems contienen precios de referencia del mercado colombiano 2025. Deben verificarse y actualizarse con cotización real del mercado local antes de presentar la oferta.
        </Text>
      )}

      {/* Resumen APU */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text>Total Equipos:</Text>
          <Text>{formatoCOP(subtotalEq)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Total Materiales:</Text>
          <Text>{formatoCOP(subtotalMat)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Total Mano de Obra:</Text>
          <Text>{formatoCOP(subtotalMO)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>H. Menor + EPP:</Text>
          <Text>{formatoCOP(costoHM + costoEPP)}</Text>
        </View>
        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryLabel}>COSTO DIRECTO UNITARIO:</Text>
          <Text style={styles.summaryLabel}>{formatoCOP(costoDirectoUnitario)}</Text>
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          Los precios incluyen todos los costos directos e indirectos. Las retenciones son responsabilidad del contratante. 
          Factor prestacional según normativa colombiana.
        </Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  );
};
