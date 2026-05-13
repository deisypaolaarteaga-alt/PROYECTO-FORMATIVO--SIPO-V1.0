import { describe, it, expect } from 'vitest';
import { calcularAPU, calcularManoObra, calcularTotalPresupuesto } from './motor-presupuesto';
import type { ParametrosFiscales } from '../fiscal/parametros';

const PARAMS_2025: ParametrosFiscales = {
  año: 2025,
  smmlv: 1423500,
  aux_transporte: 200000,
  factor_prestacional_riesgo_i: 1.522,
  factor_prestacional_riesgo_ii: 1.534,
  factor_prestacional_riesgo_iii: 1.564,
  factor_prestacional_riesgo_iv: 1.5988,
  factor_prestacional_riesgo_v: 1.646,
  divisor_apu: 182,
  tpnl_porcentaje: 22.5,
  herramienta_menor_porcentaje: 3.0,
  epp_porcentaje: 1.0,
  iva_porcentaje: 19.0
};

describe('Motor de Cálculo SIPO', () => {
  
  describe('Cálculo de Mano de Obra', () => {
    it('debe calcular el costo de jornada correctamente con factor riesgo IV', () => {
      const cuadrilla = {
        id: '1',
        nombre: 'Cuadrilla AA',
        trabajadores: [
          { jornal: 100000, nivelRiesgo: 4 as any, cantidad: 1 }
        ]
      };
      const res = calcularManoObra(cuadrilla, 10, PARAMS_2025);
      
      // 100.000 * 1.5988 = 159.880
      expect(res.costoJornada).toBe(159880);
      // 159.880 / 10 = 15.988
      expect(res.costoUnitario).toBe(15988);
    });

    it('debe lanzar error si el rendimiento es cero', () => {
      const cuadrilla = { id: '1', nombre: 'Test', trabajadores: [] };
      expect(() => calcularManoObra(cuadrilla, 0, PARAMS_2025)).toThrow('Rendimiento no puede ser cero');
    });
  });

  describe('Cálculo de APU', () => {
    it('debe calcular HM y EPP sobre el subtotal de MO', () => {
      const items: any[] = [
        { tipo: 'material', nombre: 'Cemento', cantidad: 2, precio_unitario: 25000 },
        { tipo: 'mano_obra', nombre: 'Oficial', cantidad: 0.5, precio_unitario: 100000 }
      ];
      const res = calcularAPU(items, PARAMS_2025);
      
      // Mat: 2 * 25000 = 50000
      // MO: 0.5 * 100000 = 50000
      // HM: 50000 * 3% = 1500
      // EPP: 50000 * 1% = 500
      // Total: 50000 + 50000 + 1500 + 500 = 102000
      expect(res.subtotalMateriales).toBe(50000);
      expect(res.herramientaMenor).toBe(1500);
      expect(res.epp).toBe(500);
      expect(res.costoDirecto).toBe(102000);
    });
  });

  describe('Cálculo del Presupuesto Total', () => {
    const BASE_AIU = { administracion_pct: 10, imprevistos_pct: 5, utilidad_pct: 10, metodo_iva: 'sobre_utilidad' as const, iva_porcentaje: 19 };
    const retenciones = { retefuente: 2, ica: 0.4, reteiva: 15 };

    it('debe aplicar IVA sobre la utilidad (metodo_iva: sobre_utilidad)', () => {
      // CD: 1.000.000 | Utilidad: 100.000 | IVA: 100.000*19% = 19.000
      const res = calcularTotalPresupuesto([{ subtotal: 1000000 }], BASE_AIU, retenciones);
      expect(res.utilidad).toBe(100000);
      expect(res.iva).toBe(19000);
    });

    it('debe aplicar IVA sobre el AIU total (metodo_iva: sobre_aiu)', () => {
      // CD: 1.000.000 | AIU: 250.000 | IVA: 250.000*19% = 47.500
      const aiu = { ...BASE_AIU, metodo_iva: 'sobre_aiu' as const };
      const res = calcularTotalPresupuesto([{ subtotal: 1000000 }], aiu, retenciones);
      expect(res.iva).toBe(47500);
    });

    it('debe aplicar IVA sobre el subtotal con AIU (metodo_iva: sobre_total)', () => {
      // CD: 1.000.000 | SubtotalAIU: 1.250.000 | IVA: 1.250.000*19% = 237.500
      const aiu = { ...BASE_AIU, metodo_iva: 'sobre_total' as const };
      const res = calcularTotalPresupuesto([{ subtotal: 1000000 }], aiu, retenciones);
      expect(res.iva).toBe(237500);
    });

    it('no debe aplicar IVA cuando metodo_iva es no_aplica', () => {
      const aiu = { ...BASE_AIU, metodo_iva: 'no_aplica' as const };
      const res = calcularTotalPresupuesto([{ subtotal: 1000000 }], aiu, retenciones);
      expect(res.iva).toBe(0);
    });

    it('debe calcular retenciones sobre subtotalConAIU (no sobre CD)', () => {
      // SubtotalAIU: 1.250.000 | ReteFuente: 1.250.000*2% = 25.000
      const res = calcularTotalPresupuesto([{ subtotal: 1000000 }], BASE_AIU, retenciones);
      expect(res.retenciones.retefuente).toBe(25000);
      expect(res.retenciones.esInformativa).toBe(true);
    });

    it('no debe afectar el total oferta con retenciones', () => {
      // SubtotalAIU: 1.250.000 | IVA: 19.000 | Total: 1.269.000
      const res = calcularTotalPresupuesto([{ subtotal: 1000000 }], BASE_AIU, retenciones);
      expect(res.totalOferta).toBe(1269000);
    });
  });
});
