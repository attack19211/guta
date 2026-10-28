import { UAParser } from 'ua-parser-js';
import { generateUUID } from '../app/helpers/generator.helper';

export interface DeviceContext {
    deviceId: string;
    deviceType: string;
    deviceModel: string;
    requestId: string;
}

export class DeviceParser {
    public static parse(req: any): DeviceContext {
        const headers = req?.headers || {};
        const userAgent = String(headers['user-agent'] || '');

        const parser = new UAParser(userAgent);
        const uaResult = parser.getResult();

        const requestId = String(headers['x-request-id'] || headers['x-correlation-id'] || req?.id || generateUUID());

        const deviceId = String(headers['x-device-id'] || headers['x-fingerprint'] || headers['x-client-id'] || 'unknown');

        let deviceType = headers['x-client-type'] || headers['x-app-platform'];

        if (!deviceType) {
            const parsedType = uaResult.device.type;
            if (parsedType) {
                deviceType = parsedType.toUpperCase();
            } else if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
                deviceType = 'MOBILE_WEB';
            } else {
                deviceType = 'DESKTOP_WEB';
            }
        } else {
            deviceType = String(deviceType).toUpperCase();
        }

        let deviceModel = headers['x-device-model'];

        if (!deviceModel) {
            const osName = uaResult.os.name || 'Unknown OS';
            const osVersion = uaResult.os.version ? ` ${uaResult.os.version}` : '';
            const browserName = uaResult.browser.name || 'Unknown Browser';
            const vendor = uaResult.device.vendor ? `${uaResult.device.vendor} ` : '';
            const model = uaResult.device.model ? uaResult.device.model : '';

            if (vendor || model) {
                deviceModel = `${vendor}${model} (${osName})`.trim();
            } else {
                deviceModel = `${osName}${osVersion} / ${browserName}`;
            }
        }

        return {
            deviceId,
            deviceType,
            deviceModel,
            requestId
        };
    }
}