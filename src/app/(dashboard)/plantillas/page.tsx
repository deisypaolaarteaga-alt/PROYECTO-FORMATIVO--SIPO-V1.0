import { getMisPlantillas } from '@/actions/plantillas';
import { PlantillasClient } from '@/components/plantillas/PlantillasClient';

export const metadata = {
  title: 'Mis Plantillas | SIPO',
  description: 'Gestiona tus plantillas personales de presupuesto.',
};

export default async function PlantillasPage() {
  const plantillas = await getMisPlantillas();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1C1917] leading-tight">Mis Plantillas</h1>
        <p className="text-[13px] text-[#78716C] mt-0.5">
          Reutiliza estructuras de presupuesto que ya creaste en obras anteriores.
        </p>
      </div>

      <PlantillasClient initialPlantillas={plantillas} />
    </div>
  );
}
