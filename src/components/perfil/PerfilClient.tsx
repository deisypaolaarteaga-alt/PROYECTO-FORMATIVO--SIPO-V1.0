'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, Shield, AlertTriangle, Save, Loader2, MapPin, Phone, FileText, LogOut } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Avatar } from '@/components/shared/Avatar';
import { CIUDADES_COLOMBIA } from '@/types';
import { SelectDropdown } from '@/components/shared/SelectDropdown';
import { signOut } from '@/actions/auth';
import { toast } from 'sonner';

interface PerfilClientProps {
  profile: any;
}

export function PerfilClient({ profile }: PerfilClientProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [ciudadPerfil, setCiudadPerfil] = useState(profile.ciudad || '');
  const router = useRouter();

  const handleSaveProfile = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        headers: { 'Content-Type': 'application/json' },
      });
      // Fallback: use server action directly
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const data = Object.fromEntries(formData.entries());
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Perfil actualizado');
      router.refresh();
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900">Mi perfil</h1>

      {/* Información personal */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-neutral-800">Información personal</h2>
        </div>
        <Card padding="lg">
          <form action={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={profile.nombre_completo || profile.email} size="lg" />
              <div>
                <p className="font-semibold text-neutral-900">{profile.nombre_completo || 'Sin nombre'}</p>
                <p className="text-xs text-neutral-500">{profile.email}</p>
              </div>
            </div>

            <Input name="nombre_completo" label="Nombre completo" defaultValue={profile.nombre_completo || ''} icon={<User className="h-4 w-4" />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Email</label>
                <input value={profile.email} disabled className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500" />
              </div>
              <Input name="telefono" label="Teléfono" defaultValue={profile.telefono || ''} icon={<Phone className="h-4 w-4" />} />
            </div>

            <hr className="border-neutral-100" />
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-secondary-500" />
              <p className="text-sm font-semibold text-neutral-700">Empresa</p>
            </div>

            <Input name="empresa" label="Nombre empresa" defaultValue={profile.empresa || ''} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="nit" label="NIT / Documento" defaultValue={profile.nit || ''} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Ciudad</label>
                <SelectDropdown
                  value={ciudadPerfil}
                  onChange={setCiudadPerfil}
                  options={CIUDADES_COLOMBIA.map(c => ({ value: c, label: c }))}
                  placeholder="Selecciona"
                  name="ciudad"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} icon={<Save className="h-4 w-4" />}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Seguridad */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-info-500" />
          <h2 className="text-lg font-semibold text-neutral-800">Seguridad</h2>
        </div>
        <Card padding="lg" className="space-y-4">
          <form action={signOut}>
            <Button variant="secondary" type="submit" icon={<LogOut className="h-4 w-4" />}>
              Cerrar sesión
            </Button>
          </form>
        </Card>
      </section>

      {/* Zona de peligro */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-danger-600" />
          <h2 className="text-lg font-semibold text-danger-700">Zona de peligro</h2>
        </div>
        <Card padding="lg" className="border-danger-200">
          <p className="text-sm text-neutral-600 mb-4">
            Eliminar tu cuenta borrará todos tus proyectos, presupuestos y datos asociados. Esta acción es <strong>irreversible</strong>.
          </p>
          <Input
            label='Escribe "eliminar mi cuenta" para confirmar'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <Button
            variant="danger"
            disabled={deleteConfirm !== 'eliminar mi cuenta'}
            className="mt-3"
          >
            Eliminar mi cuenta permanentemente
          </Button>
        </Card>
      </section>
    </div>
  );
}
