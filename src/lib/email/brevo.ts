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
  cuerpoCorreoPersonalizado?: string;
}

function formatearCOP(valor: number): string {
  return new Decimal(valor).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

              ${params.cuerpoCorreoPersonalizado
                ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">${escHtml(params.cuerpoCorreoPersonalizado).replace(/\n/g, '<br>')}</p>`
                : `<p style="margin:0 0 20px;font-size:16px;color:#374151;">Estimado/a <strong>${cliente}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
                Le compartimos el presupuesto de obra preparado especialmente para su proyecto.
                Puede revisarlo en detalle, aprobarlo o dejarnos sus observaciones directamente
                desde el siguiente enlace.
              </p>`
              }

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

// ── Notificación al constructor ──────────────────────────────────────────────

export interface EmailNotificacionConstructorParams {
  destinatario: string;
  nombreConstructor: string;
  nombreCliente: string;
  nombrePresupuesto: string;
  nombreProyecto: string;
  accion: 'aprobado' | 'rechazado' | 'comentado';
  comentario?: string;
  firmaNombre?: string;
  linkPresupuesto: string;
}

const CONFIG_ACCION = {
  aprobado: {
    icono: '✅',
    cardBg: '#F0FDF4',
    cardBorder: '#BBF7D0',
    accentColor: '#16A34A',
    titulo: 'Presupuesto aprobado',
    cta: 'Ver presupuesto aprobado',
  },
  rechazado: {
    icono: '❌',
    cardBg: '#FEF2F2',
    cardBorder: '#FECACA',
    accentColor: '#DC2626',
    titulo: 'Presupuesto rechazado',
    cta: 'Revisar y corregir',
  },
  comentado: {
    icono: '💬',
    cardBg: '#FFFBEB',
    cardBorder: '#FDE68A',
    accentColor: '#D97706',
    titulo: 'Nuevas observaciones',
    cta: 'Ver observaciones',
  },
} as const;

function generarHTMLNotificacionConstructor(params: EmailNotificacionConstructorParams): string {
  const cfg = CONFIG_ACCION[params.accion];
  const constructor = params.nombreConstructor || 'Constructor';
  const cliente = params.nombreCliente || 'El cliente';

  // Link directo al editor de presupuesto.
  // Si el constructor no está autenticado, el middleware lo redirige a
  // /login?redirectTo=/presupuestos/{id} y después del OTP regresa aquí.
  const urlEmail = params.linkPresupuesto;

  const descripcion: Record<string, string> = {
    aprobado:  `<strong>${cliente}</strong> ha revisado y <strong>aprobado</strong> tu presupuesto. Ya puedes proceder con la ejecución del proyecto.`,
    rechazado: `<strong>${cliente}</strong> ha rechazado el presupuesto. Revisa los comentarios y realiza los ajustes necesarios.`,
    comentado: `<strong>${cliente}</strong> dejó observaciones sobre tu presupuesto. Revísalas y responde a tiempo.`,
  };

  const bloqueComentario = params.comentario
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color:${cfg.cardBg};border:1px solid ${cfg.cardBorder};border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Comentario del cliente</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${params.comentario}</p>
            ${params.firmaNombre ? `<p style="margin:12px 0 0;font-size:12px;color:#6B7280;">— ${params.firmaNombre}</p>` : ''}
          </td>
        </tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación SIPO</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <tr>
            <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">SIPO</p>
              <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Sistema Inteligente de Presupuestos de Obra</p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#FFFFFF;padding:36px 36px 28px;">
              <p style="margin:0 0 8px;font-size:28px;">${cfg.icono}</p>
              <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">${cfg.titulo}</p>
              <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hola, <strong>${constructor}</strong></p>

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">${descripcion[params.accion]}</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#F9F8F6;border:1px solid #E5E1D8;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Presupuesto</p>
                    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">${params.nombrePresupuesto}</p>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                    <p style="margin:0 0 12px;font-size:14px;color:#374151;">${params.nombreProyecto}</p>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Cliente</p>
                    <p style="margin:0;font-size:14px;color:#374151;">${cliente}</p>
                  </td>
                </tr>
              </table>

              ${bloqueComentario}

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${urlEmail}"
                       style="display:inline-block;background-color:${cfg.accentColor};color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:-0.1px;">
                      ${cfg.cta}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">
                Si el botón no funciona, copie y pegue este enlace:<br>
                <a href="${urlEmail}" style="color:#D95510;word-break:break-all;">${urlEmail}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                Notificación automática de <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
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

// ── Confirmación de aprobación al cliente (con PDF adjunto) ─────────────────

export interface EmailConfirmacionClienteParams {
  clienteEmail: string;
  clienteNombre: string;
  constructorNombre: string;
  nombreProyecto: string;
  totalOferta: number;
  pdfBuffer: Buffer;
}

function generarHTMLConfirmacionCliente(params: EmailConfirmacionClienteParams): string {
  const cliente     = escHtml(params.clienteNombre || 'Cliente');
  const constructor = escHtml(params.constructorNombre || 'SIPO Presupuestos');
  const proyecto    = escHtml(params.nombreProyecto);
  const total       = `$${formatearCOP(params.totalOferta)} COP`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto aprobado</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Encabezado -->
          <tr>
            <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">${constructor}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Presupuesto de obra — Construcción colombiana</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="background-color:#FFFFFF;padding:36px 36px 28px;">

              <p style="margin:0 0 8px;font-size:28px;">✅</p>
              <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">Su presupuesto ha sido aprobado</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Estimado/a <strong>${cliente}</strong></p>

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                Nos complace informarle que el presupuesto para su proyecto ha sido confirmado oficialmente.
                Su proyecto está listo para iniciar. Adjunto a este correo encontrará el presupuesto en formato PDF
                para sus registros.
              </p>

              <!-- Tarjeta del proyecto -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">${proyecto}</p>

                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Valor aprobado</p>
                    <p style="margin:0;font-size:24px;font-weight:700;color:#16A34A;">${total}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
                Si tiene alguna pregunta sobre el presupuesto o los próximos pasos del proyecto,
                no dude en contactarnos directamente.
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                Este correo fue enviado por <strong>${constructor}</strong> a través de
                <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
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

export async function enviarEmailConfirmacionCliente(
  params: EmailConfirmacionClienteParams
): Promise<void> {
  const constructor = params.constructorNombre || 'SIPO Presupuestos';

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `Su presupuesto ha sido aprobado — ${params.nombreProyecto}`,
    htmlContent: generarHTMLConfirmacionCliente(params),
    sender: {
      name:  constructor,
      email: 'sipoproyecto@gmail.com',
    },
    to: [
      {
        email: params.clienteEmail,
        name:  params.clienteNombre || params.clienteEmail,
      },
    ],
    attachment: [
      {
        name:    `Presupuesto-${params.nombreProyecto.replace(/[^a-zA-Z0-9\s\-]/g, '')}-Aprobado.pdf`,
        content: params.pdfBuffer.toString('base64'),
      },
    ],
  });
}

// ── Notificación al constructor ──────────────────────────────────────────────

export async function enviarEmailNotificacionConstructor(
  params: EmailNotificacionConstructorParams
): Promise<void> {
  const asuntos: Record<string, string> = {
    aprobado:  `✅ ${params.nombreCliente} aprobó tu presupuesto "${params.nombrePresupuesto}"`,
    rechazado: `❌ ${params.nombreCliente} rechazó tu presupuesto "${params.nombrePresupuesto}"`,
    comentado: `💬 ${params.nombreCliente} dejó observaciones en "${params.nombrePresupuesto}"`,
  };

  await brevo.transactionalEmails.sendTransacEmail({
    subject: asuntos[params.accion],
    htmlContent: generarHTMLNotificacionConstructor(params),
    sender: {
      name: 'SIPO — Presupuestos de Obra',
      email: 'sipoproyecto@gmail.com',
    },
    to: [
      {
        email: params.destinatario,
        name: params.nombreConstructor || params.destinatario,
      },
    ],
  });
}

// ════════════════════════════════════════════════════════════════════
// EMAILS DE AUTOMATIZACIÓN n8n
// ════════════════════════════════════════════════════════════════════

// ── 1. Recordatorio de vencimiento (al cliente, 3 días antes) ────────

export interface EmailRecordatorioVencimientoParams {
  destinatario: string;
  nombreCliente: string;
  nombreProyecto: string;
  nombrePresupuesto: string;
  fechaVencimiento: string;
  linkPortal: string;
  nombreConstructor: string;
  emailConstructor?: string;
  telefonoConstructor?: string;
}

export async function enviarEmailRecordatorioVencimiento(
  params: EmailRecordatorioVencimientoParams
): Promise<void> {
  const cliente    = escHtml(params.nombreCliente || 'Cliente');
  const proyecto   = escHtml(params.nombreProyecto);
  const constructor = escHtml(params.nombreConstructor || 'SIPO Presupuestos');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Su presupuesto vence pronto</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">${constructor}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Sistema Inteligente de Presupuestos de Obra</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 36px 28px;">
            <p style="margin:0 0 8px;font-size:28px;">📅</p>
            <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">Su presupuesto vence en 3 días</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Estimado/a <strong>${cliente}</strong>, le recordamos amablemente que el presupuesto
              para su proyecto está próximo a vencer. Si aún no lo ha revisado, este es el momento ideal
              para hacerlo y compartir su decisión.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                  <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#111827;">${proyecto}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Presupuesto</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#374151;">${escHtml(params.nombrePresupuesto)}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Fecha de vencimiento</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#D97706;">${escHtml(params.fechaVencimiento)}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${params.linkPortal}"
                     style="display:inline-block;background-color:#D95510;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Revisar presupuesto
                  </a>
                </td>
              </tr>
            </table>
            ${params.emailConstructor || params.telefonoConstructor ? `
            <p style="margin:0 0 8px;font-size:14px;color:#6B7280;line-height:1.6;">
              ¿Tiene alguna duda? Comuníquese directamente con nosotros:
              ${params.telefonoConstructor ? `<br><strong>Tel:</strong> ${escHtml(params.telefonoConstructor)}` : ''}
              ${params.emailConstructor ? `<br><strong>Email:</strong> ${escHtml(params.emailConstructor)}` : ''}
            </p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Notificación automática de <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `Su presupuesto vence en 3 días — ${params.nombreProyecto}`,
    htmlContent: html,
    sender: { name: constructor, email: 'sipoproyecto@gmail.com' },
    to: [{ email: params.destinatario, name: params.nombreCliente || params.destinatario }],
  });
}

// ── 2. Alerta al constructor — cliente abrió el presupuesto ─────────

export interface EmailAlertaPresupuestoVistoParams {
  destinatario: string;
  nombreConstructor: string;
  nombreCliente: string;
  nombreProyecto: string;
  nombrePresupuesto: string;
  horaApertura: string;
  linkEditor: string;
}

export async function enviarEmailAlertaPresupuestoVisto(
  params: EmailAlertaPresupuestoVistoParams
): Promise<void> {
  const constructor = escHtml(params.nombreConstructor || 'Constructor');
  const cliente     = escHtml(params.nombreCliente || 'Tu cliente');
  const proyecto    = escHtml(params.nombreProyecto);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu cliente vio el presupuesto</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">SIPO</p>
            <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Sistema Inteligente de Presupuestos de Obra</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 36px 28px;">
            <p style="margin:0 0 8px;font-size:28px;">🔔</p>
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">${cliente} acaba de ver tu presupuesto</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Hola, <strong>${constructor}</strong></p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              ¡Buenas noticias! <strong>${cliente}</strong> acaba de abrir y revisar el presupuesto
              que enviaste. Ahora es el mejor momento para hacer seguimiento y resolver cualquier
              duda que pueda tener.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                  <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#111827;">${proyecto}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Presupuesto</p>
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;">${escHtml(params.nombrePresupuesto)}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Abierto a las</p>
                  <p style="margin:0;font-size:15px;color:#374151;">${escHtml(params.horaApertura)}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${params.linkEditor}"
                     style="display:inline-block;background-color:#16A34A;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Ir al presupuesto
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Notificación automática de <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `🔔 ${params.nombreCliente} acaba de ver tu presupuesto`,
    htmlContent: html,
    sender: { name: 'SIPO — Presupuestos de Obra', email: 'sipoproyecto@gmail.com' },
    to: [{ email: params.destinatario, name: params.nombreConstructor || params.destinatario }],
  });
}

// ── 3. Recordatorio al cliente — sin respuesta 72h ───────────────────

export interface EmailRecordatorioSinRespuestaParams {
  destinatario: string;
  nombreCliente: string;
  nombreProyecto: string;
  nombrePresupuesto: string;
  linkPortal: string;
  nombreConstructor: string;
  emailConstructor?: string;
  telefonoConstructor?: string;
}

export async function enviarEmailRecordatorioSinRespuesta(
  params: EmailRecordatorioSinRespuestaParams
): Promise<void> {
  const cliente     = escHtml(params.nombreCliente || 'Cliente');
  const proyecto    = escHtml(params.nombreProyecto);
  const constructor = escHtml(params.nombreConstructor || 'SIPO Presupuestos');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¿Tiene alguna pregunta?</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">${constructor}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Sistema Inteligente de Presupuestos de Obra</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 36px 28px;">
            <p style="margin:0 0 8px;font-size:28px;">💬</p>
            <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">¿Tiene alguna pregunta sobre el presupuesto?</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Estimado/a <strong>${cliente}</strong>, notamos que ya tuvo oportunidad de revisar
              el presupuesto para su proyecto. Si tiene alguna duda o necesita ajustes antes de
              tomar una decisión, con gusto le atendemos.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#F9F8F6;border:1px solid #E5E1D8;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                  <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#111827;">${proyecto}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Presupuesto</p>
                  <p style="margin:0;font-size:15px;color:#374151;">${escHtml(params.nombrePresupuesto)}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${params.linkPortal}"
                     style="display:inline-block;background-color:#D95510;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Ver presupuesto
                  </a>
                </td>
              </tr>
            </table>
            ${params.emailConstructor || params.telefonoConstructor ? `
            <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
              También puede contactarnos directamente:
              ${params.telefonoConstructor ? `<br><strong>Tel:</strong> ${escHtml(params.telefonoConstructor)}` : ''}
              ${params.emailConstructor ? `<br><strong>Email:</strong> ${escHtml(params.emailConstructor)}` : ''}
            </p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Notificación automática de <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `¿Tiene alguna pregunta sobre el presupuesto de ${params.nombreProyecto}?`,
    htmlContent: html,
    sender: { name: constructor, email: 'sipoproyecto@gmail.com' },
    to: [{ email: params.destinatario, name: params.nombreCliente || params.destinatario }],
  });
}

// ── 4. Alerta al constructor — presupuesto venció sin respuesta ──────

export interface EmailAlertaVencimientoParams {
  destinatario: string;
  nombreConstructor: string;
  nombreCliente: string;
  nombreProyecto: string;
  nombrePresupuesto: string;
  diasVencido: number;
  linkEditor: string;
}

export async function enviarEmailAlertaVencimiento(
  params: EmailAlertaVencimientoParams
): Promise<void> {
  const constructor = escHtml(params.nombreConstructor || 'Constructor');
  const cliente     = escHtml(params.nombreCliente || 'El cliente');
  const proyecto    = escHtml(params.nombreProyecto);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto vencido sin respuesta</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">SIPO</p>
            <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Sistema Inteligente de Presupuestos de Obra</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 36px 28px;">
            <p style="margin:0 0 8px;font-size:28px;">⚠️</p>
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">Presupuesto vencido sin respuesta</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Hola, <strong>${constructor}</strong></p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              El presupuesto enviado a <strong>${cliente}</strong> para el proyecto
              <strong>${proyecto}</strong> venció hace
              <strong>${params.diasVencido} ${params.diasVencido === 1 ? 'día' : 'días'}</strong>
              sin recibir respuesta. Te sugerimos realizar seguimiento directo con el cliente
              para entender su situación y, si es necesario, renovar el presupuesto con una
              nueva vigencia.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Proyecto</p>
                  <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#111827;">${proyecto}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Cliente</p>
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;">${cliente}</p>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.8px;">Vencido hace</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#DC2626;">${params.diasVencido} ${params.diasVencido === 1 ? 'día' : 'días'}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${params.linkEditor}"
                     style="display:inline-block;background-color:#DC2626;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Revisar presupuesto
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Notificación automática de <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `⚠️ Presupuesto vencido sin respuesta — ${params.nombreProyecto}`,
    htmlContent: html,
    sender: { name: 'SIPO — Presupuestos de Obra', email: 'sipoproyecto@gmail.com' },
    to: [{ email: params.destinatario, name: params.nombreConstructor || params.destinatario }],
  });
}

// ── 5. Resumen semanal al constructor ────────────────────────────────

export interface EmailResumenSemanalParams {
  destinatario: string;
  nombreConstructor: string;
  fechaSemana: string;
  presupuestosEnviados: number;
  presupuestosAprobados: number;
  presupuestosRechazados: number;
  utilidadGenerada: number;
  carteraPotencial: number;
  presupuestosPorVencer: number;
}

export async function enviarEmailResumenSemanal(
  params: EmailResumenSemanalParams
): Promise<void> {
  const constructor = escHtml(params.nombreConstructor || 'Constructor');
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://proyecto-formativo-sipo-v1-0.vercel.app';

  const filaMetrica = (icono: string, label: string, valor: string, color = '#111827') =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <span style="font-size:16px;">${icono}</span>&nbsp;
        <span style="font-size:14px;color:#6B7280;">${label}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;text-align:right;font-size:15px;font-weight:700;color:${color};">
        ${valor}
      </td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu semana en SIPO</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background-color:#1A1A1A;border-radius:12px 12px 0 0;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">SIPO</p>
            <p style="margin:6px 0 0;font-size:13px;color:#A0A0A0;">Resumen semanal — ${escHtml(params.fechaSemana)}</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 36px 28px;">
            <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Tu semana en SIPO</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6B7280;">Hola, <strong>${constructor}</strong> — aquí está el resumen de tu actividad.</p>

            <!-- Actividad semanal -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Actividad de la semana</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              ${filaMetrica('📤', 'Presupuestos enviados', `${params.presupuestosEnviados}`)}
              ${filaMetrica('✅', 'Aprobados', `${params.presupuestosAprobados}`, '#16A34A')}
              ${filaMetrica('❌', 'Rechazados', `${params.presupuestosRechazados}`, '#DC2626')}
              ${filaMetrica('💰', 'Utilidad generada', `$${formatearCOP(params.utilidadGenerada)} COP`, '#D95510')}
            </table>

            <!-- Cartera actual -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Cartera actual</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              ${filaMetrica('📊', 'Presupuestos activos (enviados/vistos)', `$${formatearCOP(params.carteraPotencial)} COP`, '#1E6FB8')}
            </table>

            ${params.presupuestosPorVencer > 0 ? `
            <!-- Alertas -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.6px;">⚠️ Atención</p>
                  <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
                    Tienes <strong>${params.presupuestosPorVencer}</strong>
                    ${params.presupuestosPorVencer === 1 ? 'presupuesto que vence' : 'presupuestos que vencen'}
                    en los próximos 7 días. Revisa tu dashboard para hacer seguimiento.
                  </p>
                </td>
              </tr>
            </table>` : ''}

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}/dashboard"
                     style="display:inline-block;background-color:#D95510;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Ir al dashboard
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F9F8F6;border-top:1px solid #E5E1D8;border-radius:0 0 12px 12px;padding:20px 36px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Resumen automático de <strong>SIPO</strong> — Sistema Inteligente de Presupuestos de Obra.<br>
              Recibes este correo cada lunes a las 7:30 a.m. hora Colombia.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `Tu semana en SIPO — ${params.fechaSemana}`,
    htmlContent: html,
    sender: { name: 'SIPO — Presupuestos de Obra', email: 'sipoproyecto@gmail.com' },
    to: [{ email: params.destinatario, name: params.nombreConstructor || params.destinatario }],
  });
}
