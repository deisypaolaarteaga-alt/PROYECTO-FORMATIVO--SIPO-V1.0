import { BrevoClient } from '@getbrevo/brevo';
import Decimal from 'decimal.js';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
});

export interface EmailPresupuestoParams {
  destinatario: string;
  nombreCliente: string | null;
  nombreEmpresa: string | null;
  nombrePresupuesto: string;
  nombreProyecto: string;
  totalOferta: number;
  linkPresupuesto: string;
  vigenciaFecha: string;
}

function formatearCOP(valor: number): string {
  return new Decimal(valor).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function generarHTMLEmail(params: EmailPresupuestoParams): string {
  const empresa = params.nombreEmpresa || 'SIPO Presupuestos';
  const cliente = params.nombreCliente || 'Cliente';
  const totalFormateado = `$${formatearCOP(params.totalOferta)} COP`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto de obra</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Encabezado empresa -->
          <tr>
            <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">${empresa}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Presupuesto de obra — Construcción colombiana</p>
            </td>
          </tr>

          <!-- Cuerpo principal -->
          <tr>
            <td style="background-color:#FFFFFF;padding:36px 36px 28px;">

              <p style="margin:0 0 20px;font-size:16px;color:#374151;">Estimado/a <strong>${cliente}</strong>,</p>

              <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
                Le compartimos el presupuesto de obra preparado especialmente para su proyecto.
                Puede revisarlo en detalle, aprobarlo o dejarnos sus observaciones directamente
                desde el siguiente enlace.
              </p>

              <!-- Tarjeta del presupuesto -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#F9F8F6;border:1px solid #E5E1D8;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Presupuesto</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">${params.nombrePresupuesto}</p>

                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#374151;">${params.nombreProyecto}</p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:50%;padding-right:12px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Total oferta</p>
                          <p style="margin:0;font-size:22px;font-weight:700;color:#D95510;">${totalFormateado}</p>
                        </td>
                        <td style="width:50%;padding-left:12px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Vigencia</p>
                          <p style="margin:0;font-size:15px;color:#374151;">${params.vigenciaFecha}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${params.linkPresupuesto}"
                       style="display:inline-block;background-color:#D95510;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:-0.1px;">
                      Ver y responder presupuesto
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">
                Si el botón no funciona, copie y pegue este enlace en su navegador:<br>
                <a href="${params.linkPresupuesto}" style="color:#D95510;word-break:break-all;">${params.linkPresupuesto}</a>
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                Este enlace es válido hasta el <strong>${params.vigenciaFecha}</strong>.<br>
                Generado por <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function enviarEmailPresupuesto(params: EmailPresupuestoParams): Promise<void> {
  const empresa = params.nombreEmpresa || 'SIPO Presupuestos';

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `Presupuesto de obra: ${params.nombrePresupuesto} — ${empresa}`,
    htmlContent: generarHTMLEmail(params),
    sender: {
      name: empresa,
      email: 'sipoproyecto@gmail.com',
    },
    to: [
      {
        email: params.destinatario,
        name: params.nombreCliente || params.destinatario,
      },
    ],
  });
}
