-- Extiende el CHECK constraint de budget_snapshots.motivo para incluir 'envio_cliente'.
-- El constraint anterior solo permitía: rechazo_cliente | reapertura_manual | aprobacion.
-- Ahora se añade 'envio_cliente' para snapshots generados al enviar el presupuesto al cliente.

-- PostgreSQL no soporta ALTER COLUMN ... DROP CONSTRAINT de columna directamente;
-- hay que eliminar el constraint de tabla y recrearlo.

ALTER TABLE budget_snapshots
  DROP CONSTRAINT IF EXISTS budget_snapshots_motivo_check;

ALTER TABLE budget_snapshots
  ADD CONSTRAINT budget_snapshots_motivo_check
    CHECK (motivo IN ('rechazo_cliente','reapertura_manual','aprobacion','envio_cliente'));
