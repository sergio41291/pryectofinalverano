import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface GroupInvitationEmailData {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  inviterName: string;
  role: 'admin' | 'member';
  groupId: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly smtpEnabled: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    this.smtpEnabled = this.configService.get('SMTP_ENABLED', 'false') === 'true';
    this.fromEmail = this.configService.get('SMTP_FROM_EMAIL', 'noreply@learpmind.ai');
    this.fromName = this.configService.get('SMTP_FROM_NAME', 'LearnMind AI');

    if (this.smtpEnabled) {
      this.initializeTransporter();
    } else {
      this.logger.warn('SMTP está deshabilitado. Los emails no se enviarán.');
    }
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT', '587')),
      secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: this.configService.get('SMTP_REJECT_UNAUTHORIZED', 'true') === 'true',
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verificar conexión SMTP
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Error al conectar con el servidor SMTP:', error);
      } else {
        this.logger.log('Servidor SMTP conectado correctamente');
      }
    });
  }

  async sendGroupInvitation(data: GroupInvitationEmailData): Promise<boolean> {
    if (!this.smtpEnabled) {
      this.logger.warn(`Email deshabilitado. No se envió invitación a ${data.recipientEmail}`);
      return false;
    }

    try {
      const htmlContent = this.generateGroupInvitationHTML(data);
      const textContent = this.generateGroupInvitationText(data);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: data.recipientEmail,
        subject: `Invitación al grupo "${data.groupName}" en LearnMind AI`,
        text: textContent,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de invitación enviado a ${data.recipientEmail}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al enviar email de invitación a ${data.recipientEmail}:`, error);
      return false;
    }
  }

  private generateGroupInvitationHTML(data: GroupInvitationEmailData): string {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    const roleText = data.role === 'admin' ? 'administrador' : 'miembro';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación al Grupo</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #667eea;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .group-info {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .group-info strong {
      color: #667eea;
      display: block;
      margin-bottom: 5px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .badge {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 LearnMind AI</h1>
    </div>
    <div class="content">
      <h2>¡Has sido invitado a un grupo!</h2>
      <p>Hola <strong>${data.recipientName}</strong>,</p>
      <p><strong>${data.inviterName}</strong> te ha invitado a unirte al grupo en LearnMind AI.</p>
      
      <div class="group-info">
        <strong>📚 Grupo:</strong>
        <p style="margin: 5px 0; font-size: 18px; font-weight: 600;">${data.groupName}</p>
        <strong>👤 Tu rol:</strong>
        <p style="margin: 5px 0;"><span class="badge">${roleText.toUpperCase()}</span></p>
      </div>

      <p>Como ${roleText} del grupo, podrás:</p>
      <ul style="color: #495057;">
        ${data.role === 'admin' ? `
        <li>✅ Administrar el grupo y sus miembros</li>
        <li>✅ Compartir documentos, mapas mentales y cuestionarios</li>
        <li>✅ Modificar configuración del grupo</li>
        ` : `
        <li>✅ Ver documentos compartidos en el grupo</li>
        <li>✅ Acceder a mapas mentales del grupo</li>
        <li>✅ Responder cuestionarios compartidos</li>
        `}
      </ul>

      <div style="text-align: center;">
        <a href="${frontendUrl}/groups/${data.groupId}" class="cta-button">
          Ver Grupo Ahora
        </a>
      </div>

      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
        Si no esperabas esta invitación, puedes ignorar este correo.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} LearnMind AI. Todos los derechos reservados.</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateGroupInvitationText(data: GroupInvitationEmailData): string {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    const roleText = data.role === 'admin' ? 'administrador' : 'miembro';

    return `
LearnMind AI - Invitación al Grupo

Hola ${data.recipientName},

${data.inviterName} te ha invitado a unirte al grupo "${data.groupName}" en LearnMind AI.

Tu rol: ${roleText.toUpperCase()}

Para ver el grupo, visita:
${frontendUrl}/groups/${data.groupId}

Si no esperabas esta invitación, puedes ignorar este correo.

---
© ${new Date().getFullYear()} LearnMind AI
Este es un correo automático, por favor no respondas a este mensaje.
    `;
  }
}
