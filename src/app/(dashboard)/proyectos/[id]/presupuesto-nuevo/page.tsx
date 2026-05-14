'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearPresupuesto } from '@/actions/presupuestos';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }> }

export default function NuevoPresupuestoPage({ params }: Props) {
  const { id } = use(params);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await crearPresupuesto(id, nombre);
    
    if (res.data) {
      router.push(`/presupuestos/${(res.data as any).id}`);
    } else {
      toast.error(res.error || 'Error al crear');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <Link href="./" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="h-4 w-4" /> Volver al proyecto
      </Link>

      <h1 className="text-2xl font-bold text-neutral-900">Nuevo presupuesto</h1>

      <Card padding="lg">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <Input
            label="Nombre del presupuesto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Presupuesto principal"
          />
          <Button type="submit" loading={loading} fullWidth>
            Crear presupuesto
          </Button>
        </form>
      </Card>
    </div>
  );
}
