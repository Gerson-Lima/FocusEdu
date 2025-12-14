// Email service for sending activity notifications via email
// Supports multiple email providers: Gmail SMTP, SendGrid, Mailgun, etc.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ActivityEmailData {
  activities: Array<{
    title: string;
    dueDate: number;
    courseName?: string;
  }>;
  userName?: string;
}

/**
 * Sends an email using the configured email service
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('[EmailService] Iniciando envio de email...');
    console.log(`[EmailService] Destinatário: ${options.to}`);
    console.log(`[EmailService] Assunto: ${options.subject}`);
    
    // Try to use nodemailer if available
    const nodemailer = await import('nodemailer').catch(() => null);
    
    if (!nodemailer) {
      console.error('[EmailService] nodemailer não está instalado. Instale com: npm install nodemailer @types/nodemailer');
      return false;
    }

    console.log('[EmailService] nodemailer carregado com sucesso');

    // Get email configuration from environment variables
    const emailConfig = getEmailConfig();
    
    if (!emailConfig) {
      console.error('[EmailService] Configuração de email não encontrada. Configure as variáveis de ambiente.');
      console.error('[EmailService] Variáveis necessárias: EMAIL_SMTP_HOST, EMAIL_SMTP_USER, EMAIL_SMTP_PASSWORD');
      console.error('[EmailService] Variáveis encontradas:', {
        EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST ? 'SIM' : 'NÃO',
        EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? 'SIM' : 'NÃO',
        EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? 'SIM' : 'NÃO',
      });
      return false;
    }

    console.log('[EmailService] Criando transporter...');
    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    console.log('[EmailService] Verificando conexão SMTP...');
    try {
      await transporter.verify();
      console.log('[EmailService] ✅ Conexão SMTP verificada com sucesso');
    } catch (verifyError: any) {
      console.error('[EmailService] ❌ Erro ao verificar conexão SMTP:', verifyError.message);
      console.error('[EmailService] Detalhes do erro:', {
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response,
      });
      return false;
    }

    console.log('[EmailService] Enviando email...');
    // Send email
    const info = await transporter.sendMail({
      from: emailConfig.auth.user,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log(`[EmailService] ✅ Email enviado com SUCESSO para ${options.to}`);
    console.log(`[EmailService] Message ID: ${info.messageId}`);
    console.log(`[EmailService] Response: ${info.response}`);
    return true;
  } catch (error: any) {
    console.error('[EmailService] ❌ Erro ao enviar email:', error);
    console.error('[EmailService] Tipo do erro:', error.constructor.name);
    console.error('[EmailService] Código do erro:', error.code);
    console.error('[EmailService] Mensagem do erro:', error.message);
    if (error.response) {
      console.error('[EmailService] Resposta do servidor:', error.response);
    }
    if (error.responseCode) {
      console.error('[EmailService] Código de resposta:', error.responseCode);
    }
    return false;
  }
}

/**
 * Gets email configuration from environment variables
 */
function getEmailConfig(): any {
  // Option 1: Gmail SMTP (most common)
  if (process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASSWORD) {
    const config = {
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: process.env.EMAIL_SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SMTP_USER?.trim(),
        pass: process.env.EMAIL_SMTP_PASSWORD?.trim().replace(/^["']|["']$/g, '') || '', // Remove aspas e espaços
      },
    };
    
    console.log('[EmailService] Configuração Gmail SMTP encontrada:');
    console.log(`[EmailService] Host: ${config.host}`);
    console.log(`[EmailService] Port: ${config.port}`);
    console.log(`[EmailService] Secure: ${config.secure}`);
    console.log(`[EmailService] User: ${config.auth.user}`);
    console.log(`[EmailService] Password: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NÃO DEFINIDA'}`);
    
    return config;
  }

  // Option 2: SendGrid
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    return {
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
      from: process.env.SENDGRID_FROM_EMAIL,
    };
  }

  // Option 3: Mailgun
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return {
      host: `smtp.mailgun.org`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USER || `postmaster@${process.env.MAILGUN_DOMAIN}`,
        pass: process.env.MAILGUN_API_KEY,
      },
    };
  }

  return null;
}

/**
 * Generates HTML email template for activity notifications
 */
function generateActivityEmailHTML(data: ActivityEmailData): string {
  const { activities, userName } = data;
  const greeting = userName ? `Olá, ${userName}!` : 'Olá!';
  
  const activitiesList = activities.map(activity => {
    const dueDate = new Date(activity.dueDate);
    const dueDateStr = dueDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = new Date(activity.dueDate);
    activityDate.setHours(0, 0, 0, 0);
    const isToday = activityDate.getTime() === today.getTime();
    const timeStr = isToday ? 'hoje' : 'amanhã';
    
    return `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${activity.title}</h3>
        <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
          <strong>Disciplina:</strong> ${activity.courseName || 'Não especificada'}
        </p>
        <p style="margin: 5px 0; color: #dc2626; font-size: 14px; font-weight: bold;">
          ⏰ Vence ${timeStr} (${dueDateStr})
        </p>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Atividades Próximas do Prazo</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⏰ Atividades Próximas do Prazo</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">${greeting}</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Você tem <strong>${activities.length}</strong> atividade${activities.length > 1 ? 's' : ''} com prazo próximo:
        </p>
        
        ${activitiesList}
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            💡 <strong>Dica:</strong> Acesse sua agenda acadêmica para ver mais detalhes e gerenciar suas atividades.
          </p>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Este é um email automático do sistema de notificações da Agenda Acadêmica.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends activity notification email to user
 */
export async function sendActivityNotificationEmail(
  userEmail: string,
  activities: Array<{ title: string; dueDate: number; courseName?: string }>,
  userName?: string
): Promise<boolean> {
  const subject = activities.length === 1
    ? `⏰ Atividade próxima do prazo: ${activities[0]!.title}`
    : `⏰ Você tem ${activities.length} atividades próximas do prazo`;

  const html = generateActivityEmailHTML({ activities, userName });

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

