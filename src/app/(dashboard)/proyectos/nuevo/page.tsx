'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/actions/proyectos';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ArrowLeft, Building2, FileText, Ruler, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteSelector } from '@/components/clientes/ClienteSelector';
import { MunicipioCombobox } from '@/components/clientes/MunicipioCombobox';
import { SelectorTipoObra } from '@/components/shared/SelectorTipoObra';
import Link from 'next/link';

const REGEX_TIPO_B = /^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/;

export default function NuevoProyectoPage() {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [tipoObra, setTipoObra] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);

  const [nombreError, setNombreError]     = useState('');
  const [ciudadError, setCiudadError]     = useState('');
  const [tipoObraError, setTipoObraError] = useState('');
  const [areaError, setAreaError]         = useState('');
  const [clienteError, setClienteError]   = useState('');

  const router = useRouter();

  const isFormValid =
    nombre.trim().length >= 1 &&
    REGEX_TIPO_B.test(nombre.trim()) &&
    ubicacion !== '' &&
    tipoObra !== '' &&
    !!clienteId &&
    parseFloat(areaM2) > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let valid = true;
    if (!nombre.trim())           { setNombreError('Este campo es obligatorio');     valid = false; }
    if (!ubicacion)               { setCiudadError('Este campo es obligatorio');     valid = false; }
    if (!tipoObra)                { setTipoObraError('Este campo es obligatorio');   valid = false; }
    if (!(parseFloat(areaM2) > 0)){ setAreaError('Debe ser mayor a 0');              valid = false; }
    if (!clienteId)               { setClienteError('Debes seleccionar un cliente'); valid = false; }
    if (!valid) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createProject(formData);
    if (res.success && res.data) {
      toast.success('Proyecto creado con éxito');
      router.push(`/proyectos/${(res.data as any).id}`);
    } else {
      toast.error(res.error || 'Error al crear el proyecto');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-8">
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-2 text-[13px] text-stone hover:text-charcoal transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a proyectos
      </Link>

      <div>
        <h1 className="text-[24px] font-bold text-ink">Nuevo proyecto</h1>
        <p className="text-[14px] text-stone mt-1">Registra los datos principales de la obra física.</p>
      </div>

      <Card padding="lg" className="border border-concrete shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">

          <Input
            name="nombre"
            label="Nombre de la obra *"
            placeholder="Ej: Casa Campestre Lote 5"
            icon={<Building2 className="h-4 w-4" />}
            required
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); if (nombreError) setNombreError(''); }}
            onBlur={() => {
              const v = nombre.trim();
              if (!v) setNombreError('Este campo es obligatorio');
              else if (!REGEX_TIPO_B.test(v)) setNombreError('Debe contener al menos una letra');
              else setNombreError('');
            }}
            error={nombreError || undefined}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <MunicipioCombobox
                value={ubicacion}
                onChange={(val) => { setUbicacion(val); if (ciudadError) setCiudadError(''); }}
                label="Ciudad *"
                placeholder="Buscar municipio..."
              />
              {ciudadError && (
                <p className="flex items-center gap-1 text-[11px] text-danger-text">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {ciudadError}
                </p>
              )}
            </div>
            <input type="hidden" name="ubicacion" value={ubicacion} />

            <div className="space-y-1.5">
              <SelectorTipoObra
                value={tipoObra}
                onChange={(val) => { setTipoObra(val); if (tipoObraError) setTipoObraError(''); }}
                name="tipo_obra"
                label="Tipo de obra *"
              />
              {tipoObraError && (
                <p className="flex items-center gap-1 text-[11px] text-danger-text">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {tipoObraError}
                </p>
              )}
            </div>
          </div>

          <Input
            name="area_m2"
            label="Área (m²) *"
            type="number"
            min="1"
            placeholder="120"
            icon={<Ruler className="h-4 w-4" />}
            required
            value={areaM2}
            onChange={(e) => { setAreaM2(e.target.value); if (areaError) setAreaError(''); }}
            onBlur={() => { if (!(parseFloat(areaM2) > 0)) setAreaError('El área debe ser un número mayor a 0'); }}
            error={areaError || undefined}
          />

          <div className="pt-2 border-t border-concrete">
            <h3 className="text-[11px] font-bold text-mortar uppercase tracking-widest mb-4">Cliente *</h3>

            <ClienteSelector
              selectedId={clienteId}
              required
              error={clienteError}
              onSelect={(id) => {
                setClienteId(id);
                if (id) setClienteError('');
              }}
            />
            <input type="hidden" name="cliente_id" value={clienteId ?? ''} />

            <p className="mt-3 text-[11px] text-mortar italic">
              * Los datos del cliente se usarán para el encabezado y firmas del presupuesto.
            </p>
          </div>

          <Input
            name="descripcion"
            label="Descripción breve"
            placeholder="Notas sobre el proyecto..."
            icon={<FileText className="h-4 w-4" />}
          />

          <div className="pt-4 flex gap-4">
            <Link href="/proyectos" className="flex-1">
              <Button variant="secondary" fullWidth type="button">Cancelar</Button>
            </Link>
            <Button type="submit" loading={loading} disabled={!isFormValid} className="flex-[2]">
              Crear proyecto
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
