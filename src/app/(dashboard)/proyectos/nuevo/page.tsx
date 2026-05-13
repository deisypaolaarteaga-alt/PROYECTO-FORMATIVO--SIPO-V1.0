'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/actions/proyectos';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ArrowLeft, Building2, MapPin, User, FileText, Ruler } from 'lucide-react';
import { CIUDADES_COLOMBIA, TIPO_OBRA_LABELS } from '@/types';
import { toast } from 'sonner';
import { ClienteSelector } from '@/components/clientes/ClienteSelector';
import Link from 'next/link';

export default function NuevoProyectoPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
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
        <form action={handleSubmit} className="space-y-6">
          
          <Input 
            name="nombre" 
            label="Nombre de la obra *" 
            placeholder="Ej: Casa Campestre Lote 5" 
            icon={<Building2 className="h-4 w-4" />} 
            required 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-stone">Ciudad *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mortar pointer-events-none">
                  <MapPin className="h-4 w-4" />
                </div>
                <select 
                  name="ubicacion" 
                  required 
                  className="w-full h-10 pl-10 pr-3 text-[14px] rounded-lg border border-concrete bg-white text-ink hover:border-mortar focus:outline-none focus:border-[var(--accent-primary)] transition-all cursor-pointer appearance-none"
                >
                  <option value="">Selecciona una ciudad</option>
                  {CIUDADES_COLOMBIA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-stone">Tipo de obra</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mortar pointer-events-none">
                  <Building2 className="h-4 w-4" />
                </div>
                <select 
                  name="tipo_obra" 
                  className="w-full h-10 pl-10 pr-3 text-[14px] rounded-lg border border-concrete bg-white text-ink hover:border-mortar focus:outline-none focus:border-[var(--accent-primary)] transition-all cursor-pointer appearance-none"
                >
                  <option value="">Selecciona tipo</option>
                  {Object.entries(TIPO_OBRA_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Input 
            name="area_m2" 
            label="Área aproximada (m²)" 
            type="number" 
            placeholder="120" 
            icon={<Ruler className="h-4 w-4" />}
          />

          <div className="pt-2 border-t border-concrete">
            <h3 className="text-[11px] font-bold text-mortar uppercase tracking-widest mb-4">Cliente</h3>
            
            <ClienteSelector 
              selectedId={null} 
              onSelect={(id) => {
                const input = document.getElementById('cliente_id_input') as HTMLInputElement;
                if (input) input.value = id || '';
              }} 
            />
            <input type="hidden" name="cliente_id" id="cliente_id_input" />
            
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
            <Button type="submit" loading={loading} className="flex-[2]">Crear proyecto</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
