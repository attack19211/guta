import { createCanvas } from 'canvas';
import { CacheService } from '@/app/services/CacheService';
import { I18nService } from '@/app/services/I18nService';

export interface CaptchaRequest {
    refNo: string;
    deviceIdCommon?: string;
    sessionId?: string;
    locale?: string;
}

export interface CaptchaVerifyRequest {
    refNo: string;
    captchaCode?: string;
    deviceIdCommon?: string;
    sessionId?: string;
    locale?: string;
}

export interface BaseApiResponse {
    resultCode: number;
    message: string;
    responseTime: number;
    imageString?: string;
}

export const CaptchaResultCode = {
    SUCCESS: 0,
    INVALID_REQUEST: -284,
    INVALID_TIME: -283,
    TIME_SKEW: -283,
    MISSING_CODE: -283,
    EXPIRED: -401,
    INCORRECT: -402,
} as const;

export class CaptchaService {
    private static readonly CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

    private static i18n(): I18nService {
        return I18nService.getInstance();
    }

    private static msg(key: string, locale?: string): string {
        return this.i18n().t(`captcha.${key}`, locale ?? 'vi');
    }

    private static getCaptchaKey(refNo: string, deviceIdCommon?: string, sessionId?: string): string {
        const deviceId = deviceIdCommon || sessionId;
        return deviceId ? `captcha:${deviceId}:${refNo}` : `captcha:${refNo}`;
    }

    private static async validateRefNo(refNo: string, deviceIdOrSession?: string, locale?: string): Promise<{ isValid: boolean; message: string; resultCode: number }> {
        const refNoRegex = /^\d{16}$/;
        if (!refNo || !refNoRegex.test(refNo)) {
            return {
                isValid: false,
                message: this.msg('invalid_request', locale),
                resultCode: CaptchaResultCode.INVALID_REQUEST
            };
        }

        const year = parseInt(refNo.substring(0, 4), 10);
        const month = parseInt(refNo.substring(4, 6), 10) - 1;
        const day = parseInt(refNo.substring(6, 8), 10);
        const hour = parseInt(refNo.substring(8, 10), 10);
        const minute = parseInt(refNo.substring(10, 12), 10);
        const second = parseInt(refNo.substring(12, 14), 10);

        const refNoDate = new Date(year, month, day, hour, minute, second);
        const refNoTimestamp = refNoDate.getTime();

        if (isNaN(refNoTimestamp)) {
            return {
                isValid: false,
                message: this.msg('invalid_time', locale),
                resultCode: CaptchaResultCode.INVALID_TIME
            };
        }

        const cache = CacheService.getInstance();
        const lastRefKey = `captcha:last_ref:${deviceIdOrSession || 'global'}`;
        const rawLastRefNo = await cache.get<any>(lastRefKey);

        if (rawLastRefNo !== null && rawLastRefNo !== undefined) {
            const lastRefNoStr = String(rawLastRefNo);

            if (refNoRegex.test(lastRefNoStr)) {
                const lastYear = parseInt(lastRefNoStr.substring(0, 4), 10);
                const lastMonth = parseInt(lastRefNoStr.substring(4, 6), 10) - 1;
                const lastDay = parseInt(lastRefNoStr.substring(6, 8), 10);
                const lastHour = parseInt(lastRefNoStr.substring(8, 10), 10);
                const lastMin = parseInt(lastRefNoStr.substring(10, 12), 10);
                const lastSec = parseInt(lastRefNoStr.substring(12, 14), 10);

                const lastRefTimestamp = new Date(lastYear, lastMonth, lastDay, lastHour, lastMin, lastSec).getTime();

                if (refNoTimestamp < lastRefTimestamp) {
                    return {
                        isValid: false,
                        message: this.msg('time_skew', locale),
                        resultCode: CaptchaResultCode.TIME_SKEW
                    };
                }
            }
        }

        await cache.set(lastRefKey, refNo, 86400);

        return { isValid: true, message: this.msg('success', locale), resultCode: CaptchaResultCode.SUCCESS };
    }

    private static generateRandomText(length: number = 6): string {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.CHARS.charAt(Math.floor(Math.random() * this.CHARS.length));
        }
        return result;
    }

    public static async generateCaptcha(payload: CaptchaRequest): Promise<BaseApiResponse> {
        const validation = await this.validateRefNo(
            payload.refNo, 
            payload.deviceIdCommon || payload.sessionId,
            payload.locale
        );
        
        if (!validation.isValid) {
            return {
                resultCode: validation.resultCode,
                message: validation.message,
                responseTime: Date.now()
            };
        }

        const text = this.generateRandomText(6);
        const width = 160;
        const height = 50;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);

        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const w = Math.random() * 60 + 10;
            const h = Math.random() * 30 + 5;
            
            ctx.strokeStyle = Math.random() > 0.5 ? '#FFE3D8' : '#D0C5C0';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
        }

        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.strokeStyle = Math.random() > 0.5 ? '#8B7B75' : '#FFD2C1';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        const charWidth = width / (text.length + 1);
        ctx.fillStyle = '#000000';

        for (let i = 0; i < text.length; i++) {
            const char: string = text[i] || '';
            const x = (i + 0.6) * charWidth;
            const y = height / 2 + Math.random() * 8 - 4;
            const angle = (Math.random() - 0.5) * 0.3;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }

        const cache = CacheService.getInstance();
        const captchaKey = this.getCaptchaKey(payload.refNo, payload.deviceIdCommon, payload.sessionId);

        await cache.set(captchaKey, text, 60);

        const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

        return {
            resultCode: CaptchaResultCode.SUCCESS,
            message: this.msg('success', payload.locale),
            imageString: base64Data,
            responseTime: Date.now()
        };
    }

    public static async verifyCaptcha(payload: CaptchaVerifyRequest): Promise<BaseApiResponse> {
        const userInputCode = (payload.captchaCode ?? '').trim();

        if (!userInputCode) {
            return {
                resultCode: CaptchaResultCode.MISSING_CODE,
                message: this.msg('missing_code', payload.locale),
                responseTime: Date.now()
            };
        }

        const cache = CacheService.getInstance();
        const captchaKey = this.getCaptchaKey(payload.refNo, payload.deviceIdCommon, payload.sessionId);

        const rawStoredCaptcha = await cache.get<any>(captchaKey);

        if (rawStoredCaptcha === null || rawStoredCaptcha === undefined) {
            return {
                resultCode: CaptchaResultCode.EXPIRED,
                message: this.msg('expired', payload.locale),
                responseTime: Date.now()
            };
        }

        const storedCaptcha = String(rawStoredCaptcha).trim();

        if (storedCaptcha !== userInputCode) {
            return {
                resultCode: CaptchaResultCode.INCORRECT,
                message: this.msg('incorrect', payload.locale),
                responseTime: Date.now()
            };
        }

        await cache.forget(captchaKey);

        return {
            resultCode: CaptchaResultCode.SUCCESS,
            message: this.msg('verify_success', payload.locale),
            responseTime: Date.now()
        };
    }
}