import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PresupuestoPDF } from './PresupuestoPDF';
import { APUDetallePDF } from './APUDetallePDF';
import type { PresupuestoPDFData, ConfigPDFProfesional, PDFExportOptions } from '@/types/pdf';
import type { Activity } from '@/types';

interface Props {
  budget: PresupuestoPDFData;
  profile: ConfigPDFProfesional;
  options?: PDFExportOptions;
}

const stubStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1C2B3A',
    paddingBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C2B3A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: '#666666',
    fontStyle: 'italic',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1C2B3A',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
  },
  colN:    { width: '10%', color: '#ffffff', fontSize: 8 },
  colDesc: { width: '55%', fontSize: 8 },
  colUnd:  { width: '15%', fontSize: 8 },
  colNota: { width: '20%', fontSize: 8, fontStyle: 'italic', color: '#888888' },
  colNHdr: { width: '10%', color: '#ffffff', fontWeight: 'bold', fontSize: 8 },
  colDHdr: { width: '55%', color: '#ffffff', fontWeight: 'bold', fontSize: 8 },
  colUHdr: { width: '15%', color: '#ffffff', fontWeight: 'bold', fontSize: 8 },
  colNotaHdr: { width: '20%', color: '#ffffff', fontWeight: 'bold', fontSize: 8 },
});

interface ActEntry { activity: Activity; chapterNumber: number; activityIndex: number }

const PaginaSinItems = ({ activities }: { activities: ActEntry[] }) => (
  <Page size="LETTER" style={stubStyles.page} break>
    <View style={stubStyles.header}>
      <Text style={stubStyles.title}>ANÁLISIS DE PRECIOS UNITARIOS — PENDIENTES DE DEFINIR</Text>
      <Text style={stubStyles.subtitle}>
        Las siguientes actividades tienen APU registrado pero sin ítems de costo ingresados.
        Completa los ítems desde el editor para generar el detalle completo.
      </Text>
    </View>
    <View style={stubStyles.tableHeader}>
      <Text style={stubStyles.colNHdr}>Ítem</Text>
      <Text style={stubStyles.colDHdr}>Descripción</Text>
      <Text style={stubStyles.colUHdr}>Unidad</Text>
      <Text style={stubStyles.colNotaHdr}>Estado</Text>
    </View>
    {activities.map(({ activity, chapterNumber }, i) => (
      <View key={activity.id} style={[stubStyles.row, i % 2 === 1 ? { backgroundColor: '#fafafa' } : {}]}>
        <Text style={stubStyles.colN}>{chapterNumber}.{activity.numero}</Text>
        <Text style={stubStyles.colDesc}>{activity.nombre}</Text>
        <Text style={stubStyles.colUnd}>{activity.unidad}</Text>
        <Text style={stubStyles.colNota}>Sin ítems definidos</Text>
      </View>
    ))}
  </Page>
);

export const PresupuestoCompletoConAPU = ({ budget, profile, options }: Props) => {
  const projectName = budget.projects?.nombre || 'Proyecto SIPO';

  const conItems: ActEntry[] = [];
  const sinItems: ActEntry[] = [];

  const sortedChapters = (budget.chapters || [])
    .slice()
    .sort((a, b) => (Number((a as any).orden) || Number(a.numero) || 0) - (Number((b as any).orden) || Number(b.numero) || 0));

  sortedChapters.forEach(ch => {
    const sortedActs = (ch.activities || [])
      .slice()
      .sort((a, b) => (Number((a as any).orden) || 0) - (Number((b as any).orden) || 0));

    sortedActs.forEach((act, j) => {
      if (!act.apu) return;
      const tieneItems = ((act as any).apu_items?.length || 0) > 0;
      const entry: ActEntry = { activity: act as Activity, chapterNumber: ch.numero, activityIndex: j + 1 };
      if (tieneItems) {
        conItems.push(entry);
      } else {
        sinItems.push(entry);
      }
    });
  });

  return (
    <PresupuestoPDF budget={budget} profile={profile} options={options}>
      {conItems.map((item, idx) => (
        <APUDetallePDF
          key={`apu-${item.activity.id}-${idx}`}
          projectName={projectName}
          activity={item.activity}
          chapterNumber={item.chapterNumber}
          activityIndex={item.activityIndex}
          parametros={options?.parametrosFiscales}
        />
      ))}
      {sinItems.length > 0 && (
        <PaginaSinItems activities={sinItems} />
      )}
    </PresupuestoPDF>
  );
};
