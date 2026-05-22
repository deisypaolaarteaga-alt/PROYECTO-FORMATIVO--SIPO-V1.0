import { obtenerCapitulosCatalogo } from '@/actions/catalogo';
import { CatalogoView } from '@/components/catalogo/CatalogoView';

export const metadata = { title: 'Catálogo de referencia — SIPO' };

export default async function CatalogoPage() {
  const res = await obtenerCapitulosCatalogo('residencial');
  const capitulosIniciales = res.success ? (res.data ?? []) : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <CatalogoView capitulosIniciales={capitulosIniciales} />
    </div>
  );
}
