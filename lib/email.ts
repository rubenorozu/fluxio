/**
 * Utilidad para enviar emails
 * Usa Resend API (https://resend.com) - Plan gratuito: 100 emails/día
 * 
 * Setup:
 * 1. Crear cuenta en https://resend.com
 * 2. Obtener API Key
 * 3. Agregar a .env.local: RESEND_API_KEY=re_xxxxx
 * 4. Agregar: ADMIN_EMAIL=tu@email.com
 */

interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
}

/**
 * Envía un email usando Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            console.warn('[Email] RESEND_API_KEY not configured, skipping email');
            return false;
        }

        const from = process.env.EMAIL_FROM || 'Fluxio RSV <onboarding@resend.dev>';

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
                text: options.text,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[Email] Failed to send:', error);
            return false;
        }

        const data = await response.json();
        console.log('[Email] Sent successfully:', data.id);
        return true;
    } catch (error) {
        console.error('[Email] Error sending email:', error);
        return false;
    }
}

/**
 * Envía notificación de nuevo custom domain al admin
 */
export async function notifyAdminNewCustomDomain(params: {
    tenantName: string;
    tenantSlug: string;
    customDomain: string;
    tenantEmail?: string;
}) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        console.warn('[Email] ADMIN_EMAIL not configured');
        return false;
    }

    const { tenantName, tenantSlug, customDomain, tenantEmail } = params;

    const html = `
        <h2>🌐 Nuevo Custom Domain Configurado</h2>
        
        <h3>📋 Detalles:</h3>
        <ul>
            <li><strong>Tenant:</strong> ${tenantName} (${tenantSlug})</li>
            <li><strong>Custom Domain:</strong> ${customDomain}</li>
            <li><strong>CNAME apunta a:</strong> ${tenantSlug}.fluxiorsv.com</li>
            ${tenantEmail ? `<li><strong>Email de contacto:</strong> ${tenantEmail}</li>` : ''}
        </ul>

        <h3>🔧 Acción Requerida en Vercel:</h3>
        <ol>
            <li>Ve a: <a href="https://vercel.com/dashboard">Vercel Dashboard</a></li>
            <li>Selecciona el proyecto "fluxio"</li>
            <li>Settings → Domains → Add Domain</li>
            <li>Agrega: <strong>${customDomain}</strong></li>
            <li>Espera 5-30 min para SSL</li>
        </ol>

        <p>Una vez agregado, el tenant podrá verificar el DNS desde su panel.</p>
    `;

    const text = `
🌐 NUEVO CUSTOM DOMAIN CONFIGURADO

📋 Detalles:
- Tenant: ${tenantName} (${tenantSlug})
- Custom Domain: ${customDomain}
- CNAME apunta a: ${tenantSlug}.fluxiorsv.com
${tenantEmail ? `- Email de contacto: ${tenantEmail}` : ''}

🔧 Acción Requerida en Vercel:
1. Ve a: https://vercel.com/dashboard
2. Selecciona el proyecto "fluxio"
3. Settings → Domains → Add Domain
4. Agrega: ${customDomain}
5. Espera 5-30 min para SSL

Una vez agregado, el tenant podrá verificar el DNS desde su panel.
    `.trim();

    return await sendEmail({
        to: adminEmail,
        subject: `🌐 Nuevo Custom Domain: ${customDomain}`,
        html,
        text,
    });
}

/**
 * Envía confirmación al tenant cuando el dominio está activo
 */
export async function notifyTenantDomainActive(params: {
    tenantEmail: string;
    customDomain: string;
    tenantName: string;
}) {
    const { tenantEmail, customDomain, tenantName } = params;

    const html = `
        <h2>✅ Tu Dominio Personalizado Está Activo</h2>
        
        <p>Hola ${tenantName},</p>
        
        <p>Tu dominio personalizado <strong>${customDomain}</strong> ha sido verificado y está activo.</p>
        
        <p>Ahora tus usuarios pueden acceder a tu plataforma desde:</p>
        <p><a href="https://${customDomain}" style="font-size: 18px; color: #0066cc;"><strong>https://${customDomain}</strong></a></p>
        
        <h3>🔒 Seguridad SSL</h3>
        <p>Tu dominio cuenta con certificado SSL activo (HTTPS) para garantizar la seguridad de tus usuarios.</p>
        
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        
        <p>Saludos,<br>
        Equipo Fluxio RSV</p>
    `;

    const text = `
✅ Tu Dominio Personalizado Está Activo

Hola ${tenantName},

Tu dominio personalizado ${customDomain} ha sido verificado y está activo.

Ahora tus usuarios pueden acceder a tu plataforma desde:
https://${customDomain}

🔒 Seguridad SSL
Tu dominio cuenta con certificado SSL activo (HTTPS) para garantizar la seguridad de tus usuarios.

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Equipo Fluxio RSV
    `.trim();

    return await sendEmail({
        to: tenantEmail,
        subject: `✅ Tu dominio ${customDomain} está activo`,
        html,
        text,
    });
}
