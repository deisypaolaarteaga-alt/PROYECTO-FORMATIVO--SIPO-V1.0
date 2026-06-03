import { getPresupuestoPublico } from '@/actions/portal-cliente';
import { PortalClientePage } from './PortalClientePage';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PresupuestoPublicoPage({ params }: Props) {
  const { token } = await params;

  const result = await getPresupuestoPublico(token);

  if (!result.success) {
    const esExpirado = result.error === 'expirado';
    return (
      <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E4DE] shadow-lg p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#F5F0EA] flex items-center justify-center mx-auto">
            <span className="text-2xl">{esExpirado ? '⏰' : '🔗'}</span>
          </div>
          <h1 className="text-xl font-bold text-[#1C1814]">
            {esExpirado
              ? 'Este presupuesto ha vencido'
              : 'Enlace no disponible'}
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            {esExpirado
              ? 'El enlace de acceso a este presupuesto ya expiró. Contacta al constructor para solicitar una actualización.'
              : 'Este link no existe o ya no está disponible. Verifica que el enlace sea correcto o solicita uno nuevo al constructor.'}
          </p>
          <p className="text-xs text-stone mt-2">
            Generado por <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra
          </p>
        </div>
      </div>
    );
  }

  const { tokenInfo, capitulos } = result.data!;

  return (
    <PortalClientePage
      token={token}
      tokenInfo={tokenInfo}
      capitulos={capitulos}
    />
  );
}
