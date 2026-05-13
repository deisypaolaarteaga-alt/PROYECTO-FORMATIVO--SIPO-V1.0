'use client';

import { useState, useRef } from 'react';
import {
  Building2, Camera, Trash2, Save, UploadCloud,
  MapPin, Phone, Mail, FileText, Loader2, CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { guardarPerfilEmpresa, subirLogoPerfil, eliminarLogoPerfil } from '@/actions/perfil';

interface Props {
  profile: Record<string, any>;
}

export function PerfilEmpresaClient({ profile }: Props) {
  const [saving, setSaving]           = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logo_url || null);

  const [formData, setFormData] = useState({
    empresa:            profile.empresa          || '',
    nit:                profile.nit              || '',
    ciudad:             profile.ciudad           || '',
    direccion:          profile.direccion        || '',
    telefono:           profile.telefono         || '',
    email_empresa:      profile.email_empresa    || '',
    regimen_tributario: profile.regimen_tributario || 'no_responsable',
  });

  const formatNit = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 9) {
      return digits.replace(/(\d{1,3})(\d{1,3})?(\d{1,3})?/, (_m, a, b, c) =>
        [a, b, c].filter(Boolean).join('.')
      );
    }
    const base   = digits.substring(0, 9).replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    const digito = digits.substring(9, 10);
    return `${base}-${digito}`;
  };

  const handleNitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 10);
    setFormData(f => ({ ...f, nit: raw }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { toast.error('El logo no puede superar 2MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WebP');
      return;
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

  const handleSave = async () => {
    if (!formData.empresa.trim()) { toast.error('El nombre de la empresa es obligatorio'); return; }
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

  const field = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Perfil de Empresa</h1>
          <p className="text-slate-500 mt-1">
            Estos datos aparecerán en el encabezado de todos tus reportes y PDFs exportados.
          </p>
        </div>
        <Button
          onClick={handleSave}
          loading={saving}
          icon={<Save className="h-4 w-4" />}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: LOGO */}
        <div className="md:col-span-1 space-y-6">
          <Card padding="none" className="overflow-hidden border-slate-200 text-center">
            <div className="bg-slate-50 p-6 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Logo Oficial</h2>
              <p className="text-[10px] text-slate-400">Visible en PDFs y Sidebar</p>
            </div>

            <div className="p-8 flex flex-col items-center justify-center gap-6">
              <div className="relative group">
                <div className={cn(
                  'w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all bg-white',
                  logoUrl ? 'border-blue-100 shadow-xl' : 'border-slate-100 border-dashed',
                )}>
                  {uploadingLogo ? (
                    <div className="flex flex-col items-center gap-2 text-blue-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Subiendo...</span>
                    </div>
                  ) : logoUrl ? (
                    <img src={logoUrl} alt="Logo Empresa" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="h-10 w-10 text-slate-200" />
                  )}
                </div>

                {!uploadingLogo && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <div className="flex flex-col w-full gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  icon={<UploadCloud className="h-4 w-4" />}
                  className="w-full border-slate-200 text-slate-600"
                  disabled={uploadingLogo}
                >
                  {logoUrl ? 'Cambiar Imagen' : 'Subir Logo'}
                </Button>
                {logoUrl && (
                  <Button
                    onClick={handleEliminarLogo}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={uploadingLogo}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">JPG, PNG o WebP. Máximo 2MB.</p>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA: DATOS */}
        <div className="md:col-span-2 space-y-6">

          {/* Información Comercial */}
          <Card padding="none" className="border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Información Comercial</h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Razón Social / Nombre de Empresa *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={formData.empresa}
                    onChange={field('empresa')}
                    placeholder="Ej: Constructora ABC S.A.S"
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">NIT / Documento</label>
                <input
                  value={formatNit(formData.nit)}
                  onChange={handleNitChange}
                  placeholder="900.123.456-7"
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 font-mono tracking-wider transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Régimen Tributario</label>
                <select
                  value={formData.regimen_tributario}
                  onChange={field('regimen_tributario')}
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 bg-white transition-all"
                >
                  <option value="no_responsable">No responsable de IVA</option>
                  <option value="responsable_iva">Responsable de IVA</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Ciudad Principal</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={formData.ciudad}
                    onChange={field('ciudad')}
                    placeholder="Ej: Bogotá D.C."
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={formData.telefono}
                    onChange={field('telefono')}
                    placeholder="Ej: 300 123 4567"
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Dirección Física</label>
                <input
                  value={formData.direccion}
                  onChange={field('direccion')}
                  placeholder="Ej: Carrera 15 # 98-42 Of 301"
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico Empresa</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email_empresa}
                    onChange={field('email_empresa')}
                    placeholder="contacto@empresa.com"
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 transition-all"
                  />
                </div>
              </div>

            </div>
          </Card>

          {/* Nota legal */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              El <strong>NIT</strong> y la <strong>razón social</strong> aparecerán en el encabezado de cada PDF exportado.
              El <strong>régimen tributario</strong> determina si se aplica IVA en tus presupuestos.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
