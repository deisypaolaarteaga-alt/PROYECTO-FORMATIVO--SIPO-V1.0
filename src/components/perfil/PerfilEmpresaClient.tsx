'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Building2, Camera, Trash2, Save, UploadCloud,
  MapPin, Phone, Mail, Loader2, CheckCircle2,
  PenLine, User, Lock, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  guardarPerfilEmpresa, subirLogoPerfil, eliminarLogoPerfil,
  subirFirmaPerfil, eliminarFirmaPerfil,
} from '@/actions/perfil';
import { cambiarContrasena } from '@/actions/auth';
import { useTheme } from '@/components/shared/ThemeProvider';
import { ACCENT_THEMES } from '@/lib/design-tokens';

interface Props {
  profile: Record<string, any>;
  email: string;
}

const SECCIONES = [
  { id: 'sec-empresa',    label: 'Empresa'        },
  { id: 'sec-apariencia', label: 'Apariencia'     },
  { id: 'sec-pdf',        label: 'PDF y reportes' },
  { id: 'sec-seguridad',  label: 'Seguridad'      },
] as const;

const DENSIDADES = [
  { value: 'compact',  label: 'Compacto'  },
  { value: 'normal',   label: 'Normal'    },
  { value: 'spacious', label: 'Espacioso' },
] as const;

export function PerfilEmpresaClient({ profile, email }: Props) {

  // ── Tema ──────────────────────────────────────────────────────────
  const { prefs, updatePref } = useTheme();

  // ── Estados de operación ──────────────────────────────────────────
  const [saving,         setSaving]         = useState(false);
  const [uploadingLogo,  setUploadingLogo]  = useState(false);
  const [uploadingFirma, setUploadingFirma] = useState(false);
  const [cambiandoPass,  setCambiandoPass]  = useState(false);

  // ── Refs de inputs de archivo ─────────────────────────────────────
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const firmaInputRef = useRef<HTMLInputElement>(null);

  // ── URLs de imágenes ──────────────────────────────────────────────
  const [logoUrl,  setLogoUrl]  = useState<string | null>(profile.logo_url  || null);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(profile.firma_url || null);

  // ── Formulario info comercial ─────────────────────────────────────
  const [formData, setFormData] = useState({
    empresa:            profile.empresa            || '',
    nit:                profile.nit                || '',
    ciudad:             profile.ciudad             || '',
    direccion:          profile.direccion           || '',
    telefono:           profile.telefono            || '',
    email_empresa:      profile.email_empresa       || '',
    regimen_tributario: profile.regimen_tributario  || 'no_responsable',
    nombre_completo:    profile.nombre_completo     || '',
    cargo_firma:        profile.cargo_firma         || '',
  });

  // ── Contraseña ────────────────────────────────────────────────────
  const [nuevaPass,    setNuevaPass]    = useState('');
  const [confirmaPass, setConfirmaPass] = useState('');
  const [verNueva,     setVerNueva]     = useState(false);
  const [verConfirma,  setVerConfirma]  = useState(false);

  // ── Scroll spy ────────────────────────────────────────────────────
  const [seccionActiva, setSeccionActiva] = useState<string>('sec-empresa');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSeccionActiva(entry.target.id);
        }
      },
      { rootMargin: '-10% 0px -75% 0px' }
    );
    SECCIONES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const formatNit = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 9)
      return digits.replace(/(\d{1,3})(\d{1,3})?(\d{1,3})?/, (_m, a, b, c) =>
        [a, b, c].filter(Boolean).join('.')
      );
    const base   = digits.substring(0, 9).replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    const digito = digits.substring(9, 10);
    return `${base}-${digito}`;
  };

  const handleNitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 10);
    setFormData(f => ({ ...f, nit: raw }));
  };

  const field = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData(f => ({ ...f, [key]: e.target.value }));

  // ── Handlers logo ─────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo no puede superar 2MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WebP'); return;
    }
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const result = await subirLogoPerfil(fd);
      if (!result.success) throw new Error(result.error);
      setLogoUrl(result.data!.url);
      toast.success('Logo actualizado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEliminarLogo = async () => {
    setUploadingLogo(true);
    try {
      const result = await eliminarLogoPerfil();
      if (!result.success) throw new Error(result.error);
      setLogoUrl(null);
      toast.success('Logo eliminado');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Handlers firma ────────────────────────────────────────────────
  const handleFirmaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('La firma no puede superar 2MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WebP'); return;
    }
    setUploadingFirma(true);
    try {
      const fd = new FormData();
      fd.append('firma', file);
      const result = await subirFirmaPerfil(fd);
      if (!result.success) throw new Error(result.error);
      setFirmaUrl(result.data!.url);
      toast.success('Firma actualizada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la firma');
    } finally {
      setUploadingFirma(false);
      if (firmaInputRef.current) firmaInputRef.current.value = '';
    }
  };

  const handleEliminarFirma = async () => {
    setUploadingFirma(true);
    try {
      const result = await eliminarFirmaPerfil();
      if (!result.success) throw new Error(result.error);
      setFirmaUrl(null);
      toast.success('Firma eliminada');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la firma');
    } finally {
      setUploadingFirma(false);
    }
  };

  // ── Handlers guardado ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.empresa.trim()) { toast.error('El nombre de la empresa es obligatorio'); return; }
    if (formData.email_empresa && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_empresa)) {
      toast.error('El correo electrónico no es válido'); return;
    }
    setSaving(true);
    try {
      const result = await guardarPerfilEmpresa(formData);
      if (!result.success) throw new Error(result.error);
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarContrasena = async () => {
    setCambiandoPass(true);
    try {
      const result = await cambiarContrasena(nuevaPass, confirmaPass);
      if (!result.success) throw new Error(result.error);
      toast.success(result.message || 'Contraseña actualizada');
      setNuevaPass('');
      setConfirmaPass('');
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar la contraseña');
    } finally {
      setCambiandoPass(false);
    }
  };

  // ── Clases reutilizables ──────────────────────────────────────────
  const inputBase =
    'w-full h-11 px-4 bg-[#F8F7F5] border border-[#E8E4DE] rounded-lg text-sm text-[#1C1814] ' +
    'placeholder:text-[#C4BBAD] outline-none transition-all ' +
    'focus:border-[#C84B1A] focus:ring-2 focus:ring-[#C84B1A]/20';
  const inputIcon =
    'w-full h-11 pl-10 pr-4 bg-[#F8F7F5] border border-[#E8E4DE] rounded-lg text-sm text-[#1C1814] ' +
    'placeholder:text-[#C4BBAD] outline-none transition-all ' +
    'focus:border-[#C84B1A] focus:ring-2 focus:ring-[#C84B1A]/20';
  const labelCls    = 'text-[11px] font-medium text-[#6B7A8D] tracking-wide';
  const h2Cls       = 'text-[15px] font-semibold text-[#1C1814]';
  const subtitleCls = 'text-[12px] text-[#6B7A8D] mt-0.5';
  const cardCls     = 'bg-white border border-[#E8E4DE] rounded-xl p-6 scroll-mt-8';

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      {/* Encabezado de página */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1C1814] tracking-tight">Configuración</h1>
        <p className="text-sm text-[#6B7A8D] mt-1">
          Gestiona tu perfil, apariencia y seguridad de la cuenta.
        </p>
      </div>

      <div className="flex gap-10 items-start">

        {/* ══ NAV LATERAL ══════════════════════════════════════════ */}
        <nav className="w-44 shrink-0 sticky top-8 hidden md:block">
          <ul className="space-y-0.5">
            {SECCIONES.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    setSeccionActiva(id);
                  }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                    seccionActiva === id
                      ? 'bg-[#FAF0EB] text-[#C84B1A]'
                      : 'text-[#6B7A8D] hover:text-[#1C1814] hover:bg-[#F5F2EE]',
                  )}
                >
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                    seccionActiva === id ? 'bg-[#C84B1A]' : 'bg-[#D0D4DB]',
                  )} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ══ CONTENIDO ════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ─────────────────────────────────────────────────────
              § EMPRESA
          ───────────────────────────────────────────────────── */}
          <section id="sec-empresa" className={cardCls}>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className={h2Cls}>Empresa</h2>
                <p className={subtitleCls}>Información comercial visible en PDFs y reportes.</p>
              </div>
              <Button
                onClick={handleSave}
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                size="sm"
              >
                Guardar
              </Button>
            </div>

            {/* Logo — fila compacta */}
            <div className="flex items-center gap-5 p-5 bg-[#F8F7F5] border border-[#E8E4DE] rounded-xl mb-6">
              <div className="relative group shrink-0">
                <div className={cn(
                  'w-20 h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden bg-white shadow-sm',
                  logoUrl ? 'border-[#E8E4DE]' : 'border-dashed border-[#D0D4DB]',
                )}>
                  {uploadingLogo ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#C84B1A]" />
                  ) : logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-7 w-7 text-[#D0D4DB]" />
                  )}
                </div>
                {!uploadingLogo && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-[#1A2535]/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1C1814]">Logo oficial</p>
                <p className="text-[11px] text-[#6B7A8D] mt-0.5">
                  {logoUrl
                    ? 'Visible en PDFs y sidebar'
                    : 'Sin logo · JPG, PNG o WebP, máx. 2 MB'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  icon={<UploadCloud className="h-3.5 w-3.5" />}
                  disabled={uploadingLogo}
                >
                  {logoUrl ? 'Cambiar' : 'Subir'}
                </Button>
                {logoUrl && (
                  <Button
                    onClick={handleEliminarLogo}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="text-[#991B1B] hover:text-[#991B1B] hover:bg-[#FEF0F0]"
                    disabled={uploadingLogo}
                  />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>

            {/* Campos comerciales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Razón Social / Nombre de empresa *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    value={formData.empresa}
                    onChange={field('empresa')}
                    placeholder="Ej: Constructora ABC S.A.S"
                    className={cn(inputIcon, 'font-semibold')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>NIT / Documento</label>
                <input
                  value={formatNit(formData.nit)}
                  onChange={handleNitChange}
                  placeholder="900.123.456-7"
                  className={cn(inputBase, 'font-mono tracking-wider')}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Régimen tributario</label>
                <select
                  value={formData.regimen_tributario}
                  onChange={field('regimen_tributario')}
                  className={inputBase}
                >
                  <option value="no_responsable">No responsable de IVA</option>
                  <option value="responsable_iva">Responsable de IVA</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Ciudad principal</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    value={formData.ciudad}
                    onChange={field('ciudad')}
                    placeholder="Ej: Bogotá D.C."
                    className={inputIcon}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Teléfono de contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    value={formData.telefono}
                    onChange={field('telefono')}
                    placeholder="Ej: 300 123 4567"
                    className={inputIcon}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Dirección física</label>
                <input
                  value={formData.direccion}
                  onChange={field('direccion')}
                  placeholder="Ej: Carrera 15 # 98-42 Of 301"
                  className={inputBase}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Correo electrónico empresa</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    type="email"
                    value={formData.email_empresa}
                    onChange={field('email_empresa')}
                    placeholder="contacto@empresa.com"
                    className={inputIcon}
                  />
                </div>
              </div>

            </div>

            {/* Nota informativa */}
            <div className="mt-6 flex items-start gap-3 bg-[#EBF2FA] border border-[#C8D8F0] rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-[#1E4D8C] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#1E4D8C] leading-relaxed">
                El <strong>NIT</strong> y la <strong>razón social</strong> aparecen en el encabezado
                de cada PDF exportado. El <strong>régimen tributario</strong> determina si se aplica
                IVA en tus presupuestos.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              § APARIENCIA
          ───────────────────────────────────────────────────── */}
          <section id="sec-apariencia" className={cardCls}>

            <div className="mb-6">
              <h2 className={h2Cls}>Apariencia</h2>
              <p className={subtitleCls}>Color de acento y densidad de la interfaz.</p>
            </div>

            {/* Color de acento */}
            <div className="space-y-3 mb-7">
              <label className={labelCls}>Color de acento</label>
              <div className="flex items-center gap-3">
                {(Object.entries(ACCENT_THEMES) as [string, typeof ACCENT_THEMES[keyof typeof ACCENT_THEMES]][]).map(([key, theme]) => {
                  const active = prefs.accentColor === theme.primary;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updatePref('accentColor', theme.primary)}
                      title={theme.label}
                      className={cn(
                        'relative w-12 h-12 rounded-xl transition-all duration-150 shrink-0',
                        active
                          ? 'ring-2 ring-offset-2 scale-105 shadow-md'
                          : 'hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100',
                      )}
                      style={{
                        backgroundColor: theme.primary,
                        outline: active ? `2px solid ${theme.primary}` : undefined,
                        outlineOffset: active ? '3px' : undefined,
                      }}
                    >
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                {(Object.entries(ACCENT_THEMES) as [string, typeof ACCENT_THEMES[keyof typeof ACCENT_THEMES]][]).map(([key, theme]) => (
                  <span
                    key={key}
                    className="w-12 text-center text-[10px] text-[#6B7A8D] leading-tight"
                  >
                    {theme.label.split(' ')[0]}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#6B7A8D]">
                Afecta botones, enlaces y elementos interactivos en toda la plataforma.
              </p>
            </div>

            {/* Densidad */}
            <div className="space-y-3">
              <label className={labelCls}>Densidad de la interfaz</label>
              <div className="flex items-center gap-2">
                {DENSIDADES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updatePref('density', value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-[12px] font-medium border transition-all',
                      prefs.density === value
                        ? 'bg-[#C84B1A] text-white border-[#C84B1A]'
                        : 'bg-[#F8F7F5] text-[#6B7A8D] border-[#E8E4DE] hover:border-[#C84B1A] hover:text-[#C84B1A]',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#6B7A8D]">
                Afecta el espaciado de tablas y paneles en el editor de presupuestos.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              § PDF Y REPORTES
          ───────────────────────────────────────────────────── */}
          <section id="sec-pdf" className={cardCls}>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className={h2Cls}>PDF y reportes</h2>
                <p className={subtitleCls}>Firma del elaborador que aparece al pie de cada presupuesto.</p>
              </div>
              <Button
                onClick={handleSave}
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                size="sm"
              >
                Guardar
              </Button>
            </div>

            {/* Nombre y cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="space-y-1.5">
                <label className={labelCls}>Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    value={formData.nombre_completo}
                    onChange={field('nombre_completo')}
                    placeholder="Ej: Carlos Andrés Pérez"
                    className={inputIcon}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Cargo / Matrícula profesional</label>
                <input
                  value={formData.cargo_firma}
                  onChange={field('cargo_firma')}
                  placeholder="Ej: Ing. Civil M.P. 12345-67890"
                  className={inputBase}
                />
              </div>
            </div>

            {/* Firma — layout horizontal */}
            <div className="space-y-2">
              <label className={labelCls}>Firma escaneada</label>

              <div className="flex items-start gap-5 p-4 bg-[#F8F7F5] border border-[#E8E4DE] rounded-lg">
                {/* Preview 140px ancho */}
                <div className={cn(
                  'w-36 h-20 border-2 rounded-lg flex items-center justify-center overflow-hidden bg-white shrink-0',
                  firmaUrl ? 'border-[#E8E4DE]' : 'border-dashed border-[#D0D4DB]',
                )}>
                  {uploadingFirma ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#C84B1A]" />
                  ) : firmaUrl ? (
                    <img src={firmaUrl} alt="Firma" className="w-full h-full object-contain p-2" />
                  ) : (
                    <PenLine className="h-6 w-6 text-[#D0D4DB]" />
                  )}
                </div>

                {/* Texto y botones */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1C1814]">
                    {firmaUrl ? 'Firma cargada' : 'Sin firma'}
                  </p>
                  <p className="text-[11px] text-[#6B7A8D] mt-0.5 mb-3">
                    JPG, PNG o WebP · máx. 2 MB · aparece sobre la línea de firma en el PDF.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => firmaInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      icon={<UploadCloud className="h-3.5 w-3.5" />}
                      disabled={uploadingFirma}
                    >
                      {firmaUrl ? 'Cambiar firma' : 'Subir firma'}
                    </Button>
                    {firmaUrl && (
                      <Button
                        onClick={handleEliminarFirma}
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        className="text-[#991B1B] hover:text-[#991B1B] hover:bg-[#FEF0F0]"
                        disabled={uploadingFirma}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <input
                type="file"
                ref={firmaInputRef}
                onChange={handleFirmaFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              § SEGURIDAD
          ───────────────────────────────────────────────────── */}
          <section id="sec-seguridad" className={cardCls}>

            <div className="mb-6">
              <h2 className={h2Cls}>Seguridad</h2>
              <p className={subtitleCls}>Cambia tu contraseña de acceso a la cuenta.</p>
            </div>

            {/* Email (solo lectura) */}
            <div className="mb-5 space-y-1.5">
              <label className={labelCls}>Correo electrónico de la cuenta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                <input
                  value={email}
                  readOnly
                  className={cn(inputIcon, 'opacity-60 cursor-default select-all')}
                />
              </div>
              <p className="text-[11px] text-[#6B7A8D]">
                El correo no puede cambiarse desde aquí. Contacta soporte si necesitas actualizarlo.
              </p>
            </div>

            <div className="border-t border-[#E8E4DE] pt-5 mb-5">
              <p className="text-[13px] font-medium text-[#1C1814] mb-1">Cambiar contraseña</p>
              <p className="text-[11px] text-[#6B7A8D]">
                Usa mínimo 8 caracteres con al menos una mayúscula y un número.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nueva contraseña */}
              <div className="space-y-1.5">
                <label className={labelCls}>Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    type={verNueva ? 'text' : 'password'}
                    value={nuevaPass}
                    onChange={e => setNuevaPass(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className={cn(inputIcon, 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setVerNueva(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4BBAD] hover:text-[#6B7A8D] transition-colors"
                  >
                    {verNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-1.5">
                <label className={labelCls}>Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4BBAD]" />
                  <input
                    type={verConfirma ? 'text' : 'password'}
                    value={confirmaPass}
                    onChange={e => setConfirmaPass(e.target.value)}
                    placeholder="Repite la contraseña"
                    className={cn(inputIcon, 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirma(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4BBAD] hover:text-[#6B7A8D] transition-colors"
                  >
                    {verConfirma ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Button
                onClick={handleCambiarContrasena}
                loading={cambiandoPass}
                disabled={!nuevaPass || !confirmaPass}
                icon={<ShieldCheck className="h-4 w-4" />}
                size="sm"
              >
                Actualizar contraseña
              </Button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
