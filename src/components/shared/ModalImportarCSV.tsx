'use client';

import { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, Download, CheckCircle2, AlertCircle,
  Loader2, FileText, AlertTriangle,
} from 'lucide-react';
import { descargarPlantillaCSV } from '@/lib/csv/descargar-plantilla';
import { cn } from '@/lib/utils';

export type ImportarCSVEntidad = 'clientes' | 'proveedores' | 'insumos';

export type ResultadoImportacion = {
  importados: number;
  errores: { fila: number; mensaje: string }[];
};

type Props = {
  entidad: ImportarCSVEntidad;
  titulo: string;
  columnas: string[];
  onImportar: (filas: Record<string, string>[]) => Promise<ResultadoImportacion>;
  onClose: () => void;
};

type Estado = 'idle' | 'parseando' | 'preview' | 'importando' | 'resultado';

export function ModalImportarCSV({ entidad, titulo, columnas, onImportar, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>('idle');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [filas, setFilas] = useState<Record<string, string>[]>([]);
  const [erroresColumnasF, setErroresColumnas] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  const parsearArchivo = useCallback((file: File) => {
    setEstado('parseando');
    setErroresColumnas([]);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('No se pudo leer el archivo');

        const wb = XLSX.read(data, { type: 'binary', raw: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<string[]>(ws, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (rawRows.length < 2) {
          setErroresColumnas(['El archivo está vacío o solo tiene encabezados.']);
          setEstado('idle');
          return;
        }

        const rawHeaders = (rawRows[0] as string[]).map((h) =>
          String(h ?? '').trim().toLowerCase().replace(/\s+/g, '_')
        );

        // Verificar columnas requeridas
        const faltantes = columnas.filter((col) => !rawHeaders.includes(col));
        if (faltantes.length > 0) {
          setErroresColumnas([
            `Columnas faltantes: ${faltantes.join(', ')}`,
            `El archivo tiene: ${rawHeaders.join(', ')}`,
          ]);
          setEstado('idle');
          return;
        }

        // Construir objetos por fila (saltando encabezado)
        const filasParsed: Record<string, string>[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i] as string[];
          const obj: Record<string, string> = {};
          rawHeaders.forEach((h, idx) => {
            obj[h] = String(row[idx] ?? '').trim();
          });
          // Solo incluir filas con al menos un campo no vacío
          const tieneContenido = Object.values(obj).some((v) => v !== '');
          if (tieneContenido) filasParsed.push(obj);
        }

        if (filasParsed.length === 0) {
          setErroresColumnas(['El archivo no contiene filas con datos.']);
          setEstado('idle');
          return;
        }

        setHeaders(rawHeaders);
        setFilas(filasParsed);
        setNombreArchivo(file.name);
        setEstado('preview');
      } catch (err) {
        console.error('[ModalImportarCSV] parse error:', err);
        setErroresColumnas(['No se pudo leer el archivo. Asegúrate de que sea un CSV válido.']);
        setEstado('idle');
      }
    };
    reader.readAsBinaryString(file);
  }, [columnas]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parsearArchivo(file);
    // Reset input para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  }, [parsearArchivo]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) parsearArchivo(file);
  }, [parsearArchivo]);

  const handleImportar = useCallback(async () => {
    setEstado('importando');
    try {
      const res = await onImportar(filas);
      setResultado(res);
      setEstado('resultado');
    } catch (err) {
      console.error('[ModalImportarCSV] import error:', err);
      setResultado({ importados: 0, errores: [{ fila: 0, mensaje: 'Error inesperado al importar.' }] });
      setEstado('resultado');
    }
  }, [filas, onImportar]);

  const resetear = useCallback(() => {
    setEstado('idle');
    setNombreArchivo('');
    setHeaders([]);
    setFilas([]);
    setErroresColumnas([]);
    setResultado(null);
  }, []);

  const previewFilas = filas.slice(0, 5);
  const columnasMostrar = columnas.filter((c) => headers.includes(c));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8] bg-[#F8F7F5] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">Importar {titulo} desde CSV</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Descarga la plantilla, llénala y súbela aquí.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#E5E1D8]/60 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Botón descargar plantilla */}
          <button
            onClick={() => descargarPlantillaCSV(entidad)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[#C84B1A]/50 rounded-xl text-sm font-medium text-[#C84B1A] hover:bg-[#FFF4EE] transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar plantilla {titulo.toLowerCase()}.csv
          </button>

          {/* Zona de carga */}
          {(estado === 'idle' || estado === 'parseando') && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-[#E5E1D8] rounded-xl cursor-pointer hover:border-[#C84B1A]/50 hover:bg-[#FFF4EE]/30 transition-all"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {estado === 'parseando' ? (
                <Loader2 className="h-8 w-8 text-[#C84B1A] animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-[#9CA3AF]" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-[#374151]">
                  {estado === 'parseando' ? 'Procesando archivo…' : 'Arrastra tu CSV aquí o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">Solo archivos .csv</p>
              </div>
            </div>
          )}

          {/* Errores de columnas */}
          {erroresColumnasF.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 space-y-1">
                {erroresColumnasF.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            </div>
          )}

          {/* Preview */}
          {(estado === 'preview' || estado === 'importando') && filas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm font-medium text-[#374151]">{nombreArchivo}</span>
                <span className="text-xs text-[#9CA3AF]">— {filas.length} registros encontrados</span>
                {estado === 'preview' && (
                  <button
                    onClick={resetear}
                    className="ml-auto text-xs text-[#6B7280] hover:text-red-600 transition-colors underline"
                  >
                    Cambiar archivo
                  </button>
                )}
              </div>

              {/* Tabla preview */}
              <div className="border border-[#E5E1D8] rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-[#F8F7F5] border-b border-[#E5E1D8]">
                  <p className="text-xs text-[#6B7280] font-medium">
                    Vista previa — {Math.min(5, filas.length)} de {filas.length} filas
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1A2535]">
                        {columnasMostrar.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-white/70 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {previewFilas.map((fila, i) => (
                        <tr key={i} className="hover:bg-[#F9FAFB]">
                          {columnasMostrar.map((col) => (
                            <td key={col} className="px-3 py-2 text-[#374151] max-w-[160px] truncate">
                              {fila[col] || <span className="text-[#D1D5DB]">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Resultado */}
          {estado === 'resultado' && resultado && (
            <div className="space-y-4">
              <div className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-xl border',
                resultado.errores.length === 0
                  ? 'bg-green-50 border-green-200'
                  : resultado.importados === 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              )}>
                {resultado.errores.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : resultado.importados === 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-semibold text-[#111827]">
                    {resultado.importados} importados correctamente
                    {resultado.errores.length > 0 && `, ${resultado.errores.length} con errores`}
                  </p>
                  {resultado.errores.length === 0 && (
                    <p className="text-green-700 mt-0.5">Todos los registros se importaron sin problemas.</p>
                  )}
                </div>
              </div>

              {resultado.errores.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 border-b border-red-200">
                    <p className="text-xs font-semibold text-red-700">Detalle de errores</p>
                  </div>
                  <div className="overflow-y-auto max-h-40">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#FEF2F2]">
                          <th className="px-3 py-2 text-left font-medium text-red-700 w-16">Fila</th>
                          <th className="px-3 py-2 text-left font-medium text-red-700">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {resultado.errores.map((e, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-[#6B7280] font-mono">{e.fila === 0 ? '—' : e.fila + 1}</td>
                            <td className="px-3 py-2 text-red-700">{e.mensaje}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E1D8] bg-[#F8F7F5] shrink-0 flex items-center justify-between gap-3">
          {estado === 'resultado' ? (
            <>
              <button
                onClick={resetear}
                className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E1D8] rounded-lg hover:bg-white transition-colors"
              >
                Importar otro archivo
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#C84B1A] text-white text-sm font-semibold rounded-lg hover:bg-[#A83A14] transition-colors"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E1D8] rounded-lg hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportar}
                disabled={estado !== 'preview' || filas.length === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
                  estado === 'preview' && filas.length > 0
                    ? 'bg-[#C84B1A] text-white hover:bg-[#A83A14]'
                    : 'bg-[#E5E1D8] text-[#9CA3AF] cursor-not-allowed'
                )}
              >
                {estado === 'importando' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importando…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Importar {filas.length > 0 ? `${filas.length} registros` : ''}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
