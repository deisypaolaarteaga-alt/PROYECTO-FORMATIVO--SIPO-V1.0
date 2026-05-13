import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 88, height: 28, iconSize: 24 },
  md: { width: 110, height: 34, iconSize: 30 },
  lg: { width: 140, height: 42, iconSize: 38 },
};

/**
 * Logo SIPO — Símbolo geométrico + wordmark
 * Símbolo: Letra S estilizada en cuadrado redondeado burn-orange
 */
export function Logo({ variant = 'full', className, size = 'md' }: LogoProps) {
  const s = sizes[size];
  const isWhite = variant === 'white';
  const symbolBg = isWhite ? '#FFFFFF' : 'var(--accent-primary, #E8571A)';
  const symbolText = isWhite ? '#1C2B3A' : '#FFFFFF';
  const wordColor = isWhite ? '#FFFFFF' : '#1C2B3A';

  if (variant === 'icon') {
    return (
      <svg
        width={s.iconSize}
        height={s.iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0', className)}
        aria-label="SIPO"
      >
        <rect width="32" height="32" rx="7" fill={symbolBg} />
        {/* S estilizada — forma geométrica de plano */}
        <path
          d="M10 12.5C10 10.567 11.567 9 13.5 9H18C19.657 9 21 10.343 21 12C21 13.657 19.657 15 18 15H14C12.343 15 11 16.343 11 18C11 19.657 12.343 21 14 21H18.5C20.433 21 22 22.567 22 24.5"
          stroke={symbolText}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Líneas de plano arquitectónico */}
        <line x1="7" y1="26" x2="25" y2="26" stroke={symbolText} strokeWidth="1" strokeOpacity="0.3" />
        <line x1="7" y1="28" x2="20" y2="28" stroke={symbolText} strokeWidth="1" strokeOpacity="0.15" />
      </svg>
    );
  }

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox="0 0 110 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="SIPO"
    >
      {/* Símbolo */}
      <rect width="30" height="30" rx="6.5" y="2" fill={symbolBg} />
      <path
        d="M9 13C9 11.343 10.343 10 12 10H16C17.38 10 18.5 11.12 18.5 12.5C18.5 13.88 17.38 15 16 15H13C11.62 15 10.5 16.12 10.5 17.5C10.5 18.88 11.62 20 13 20H17C18.657 20 20 21.343 20 23"
        stroke={symbolText}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="6" y1="25" x2="24" y2="25" stroke={symbolText} strokeWidth="0.8" strokeOpacity="0.3" />

      {/* Wordmark */}
      <text
        x="38"
        y="23"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
        fontSize="19"
        letterSpacing="-0.3"
        fill={wordColor}
      >
        SIPO
      </text>
    </svg>
  );
}
