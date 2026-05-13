import { EmptyState } from '@/components/shared/EmptyState';

export default function IAPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Asistente IA</h1>
      <EmptyState
        icon="empty"
        title="Próximamente"
        description="El asistente IA estará disponible en el Prompt 3."
      />
    </div>
  );
}
