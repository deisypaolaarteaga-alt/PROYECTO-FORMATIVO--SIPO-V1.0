'use client';

import { useTheme } from '@/components/shared/ThemeProvider';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { ACCENT_THEMES, type AccentTheme } from '@/lib/design-tokens';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const densityOptions = [
  { value: 'compact' as const, label: 'Compacta', desc: 'Ideal para pantallas pequeñas' },
  { value: 'normal' as const, label: 'Normal', desc: 'Configuración predeterminada' },
  { value: 'spacious' as const, label: 'Espaciosa', desc: 'Ideal para presentaciones' },
];

export default function AparienciaPage() {
  const { prefs, updatePref, resetPrefs, accentThemeKey } = useTheme();

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[20px] font-semibold text-ink">Apariencia</h1>
        <p className="text-[13px] text-stone mt-1">Personaliza la interfaz de SIPO.</p>
      </div>

      {/* ── Tema de color ── */}
      <Card padding="lg">
        <h2 className="text-[15px] font-semibold text-ink mb-1">Tema de color</h2>
        <p className="text-[13px] text-stone mb-4">
          El acento afecta botones, sidebar activo y bordes de foco.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(ACCENT_THEMES) as [AccentTheme, typeof ACCENT_THEMES[AccentTheme]][]).map(
            ([key, theme]) => (
              <button
                key={key}
                onClick={() => updatePref('accentColor', theme.primary)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-[12px] border transition-all cursor-pointer',
                  accentThemeKey === key
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-pale)]'
                    : 'border-concrete hover:border-mortar bg-white'
                )}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.primary }}
                >
                  {accentThemeKey === key && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-charcoal">{theme.label}</span>
              </button>
            )
          )}
        </div>
      </Card>

      {/* ── Densidad ── */}
      <Card padding="lg">
        <h2 className="text-[15px] font-semibold text-ink mb-1">Densidad</h2>
        <p className="text-[13px] text-stone mb-4">
          Ajusta el espaciado y tamaño de la interfaz.
        </p>
        <div className="space-y-2">
          {densityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updatePref('density', opt.value)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all cursor-pointer text-left',
                prefs.density === opt.value
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-pale)]'
                  : 'border-concrete hover:border-mortar bg-white'
              )}
            >
              <div>
                <p className="text-[13px] font-medium text-ink">{opt.label}</p>
                <p className="text-[11px] text-stone">{opt.desc}</p>
              </div>
              {prefs.density === opt.value && (
                <Check className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Nombre de empresa ── */}
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Nombre de empresa en sidebar</h2>
            <p className="text-[13px] text-stone mt-0.5">Muestra u oculta el nombre de tu empresa.</p>
          </div>
          <button
            onClick={() => updatePref('showCompanyName', !prefs.showCompanyName)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
              prefs.showCompanyName ? 'bg-[var(--accent-primary)]' : 'bg-concrete'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-transform',
                prefs.showCompanyName && 'translate-x-5'
              )}
            />
          </button>
        </div>
      </Card>

      {/* ── Reset ── */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={resetPrefs}
        >
          Restaurar defaults
        </Button>
      </div>
    </div>
  );
}
