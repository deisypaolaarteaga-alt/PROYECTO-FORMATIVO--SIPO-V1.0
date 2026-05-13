'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const INTERVALO_MS = 30_000;

interface UseAutoGuardadoOptions {
  key: string;
  data: unknown;
  enabled?: boolean;
}

interface UseAutoGuardadoReturn {
  tienesCambiosPendientes: boolean;
  ultimoGuardado: Date | null;
  guardarAhora: () => void;
  restaurarBorrador: () => unknown | null;
  limpiarBorrador: () => void;
}

export function useAutoGuardado({
  key,
  data,
  enabled = true,
}: UseAutoGuardadoOptions): UseAutoGuardadoReturn {
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const [tienesCambiosPendientes, setTienesCambiosPendientes] = useState(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
    setTienesCambiosPendientes(true);
  }, [data]);

  const guardarAhora = useCallback(() => {
    if (!enabled) return;
    try {
      const payload = { ts: new Date().toISOString(), data: dataRef.current };
      localStorage.setItem(`sipo_borrador_${key}`, JSON.stringify(payload));
      const now = new Date();
      setUltimoGuardado(now);
      setTienesCambiosPendientes(false);
    } catch {
      // localStorage puede estar lleno o deshabilitado
    }
  }, [key, enabled]);

  const restaurarBorrador = useCallback((): unknown | null => {
    try {
      const raw = localStorage.getItem(`sipo_borrador_${key}`);
      if (!raw) return null;
      const { data: saved } = JSON.parse(raw);
      return saved;
    } catch {
      return null;
    }
  }, [key]);

  const limpiarBorrador = useCallback(() => {
    try {
      localStorage.removeItem(`sipo_borrador_${key}`);
      setTienesCambiosPendientes(false);
    } catch {
      // ignore
    }
  }, [key]);

  // Auto-save each INTERVALO_MS
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(guardarAhora, INTERVALO_MS);
    return () => clearInterval(id);
  }, [enabled, guardarAhora]);

  return { tienesCambiosPendientes, ultimoGuardado, guardarAhora, restaurarBorrador, limpiarBorrador };
}
