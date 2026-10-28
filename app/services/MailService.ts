import nodemailer from 'nodemailer'
import env from '@/libs/env.lib'

export class MailService {
    private static transporter: nodemailer.Transporter | null = null

    private static getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: env('MAIL_HOST', 'smtp.gmail.com'),
                port: Number(env('MAIL_PORT', 465)),
                secure: Number(env('MAIL_PORT', 465)) === 465,
                auth: {
                    user: env('MAIL_USERNAME', ''),
                    pass: env('MAIL_PASSWORD', ''),
                },
                pool: true,
                maxConnections: Number(env('MAIL_POOL_MAX_CONNECTIONS', 5)),
                maxMessages: Number(env('MAIL_POOL_MAX_MESSAGES', 100)),
                rateDelta: Number(env('MAIL_POOL_RATE_DELTA', 1000)),
                rateLimit: Number(env('MAIL_POOL_RATE_LIMIT', 5)),
            })
        }
        return this.transporter
    }

    public static renderTemplate(template: string, payload: Record<string, any>): string {
        let rendered = template
        for (const key of Object.keys(payload)) {
            const value = payload[key] !== undefined && payload[key] !== null ? String(payload[key]) : ''
            rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), value)
        }
        return rendered
    }

    public static async sendMail(options: {
        to: string
        subject: string
        html: string
        text?: string
        from?: string
        fromName?: string
    }): Promise<any> {
        const transporter = this.getTransporter()
        const fromAddress = options.from || env('MAIL_FROM_ADDRESS', 'hello@example.com')
        const fromName = options.fromName || env('MAIL_FROM_NAME', 'Example')

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to: options.to,
            subject: options.subject,
            text: options.text || '',
            html: options.html,
        })

        return info
    }
}