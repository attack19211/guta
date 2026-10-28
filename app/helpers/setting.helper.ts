// helpers/setting.helper.ts

import { Setting } from '@/app/models/Setting';

type SettingCache = Record<string, any>;

class SettingService {
    private cache: SettingCache = {};
    private loaded = false;

    private async loadAll() {
        if (this.loaded) return;

        const q = (Setting as any).query().withTrashed();
        const settings = await q.get();

        this.cache = {};
        for (const item of settings) {
            this.cache[item.key] = item.value;
        }

        this.loaded = true;
    }

    async get(key: string, defaultValue: any = 'N/A') {
        await this.loadAll();
        return this.cache[key] ?? defaultValue;
    }

    async set(key: string, value: any, objectType: 'PUBLISHED' | 'PRIVATED' = 'PUBLISHED') {
        const exists = await Setting.findByKey(key);
        if (exists) {
            await Setting.updateValue(key, String(value));
        } else {
            await Setting.create({ key, value: String(value), objectType });
        }

        this.cache[key] = value;
    }

    async all() {
        await this.loadAll();
        return this.cache;
    }

    clearCache() {
        this.cache = {};
        this.loaded = false;
    }
}

const settingService = new SettingService();

export const setting = new Proxy(settingService, {
    get(target, prop: string) {
        if (prop in target) {
            const val = (target as any)[prop];
            if (typeof val === 'function') {
                return val.bind(target);
            }
            return val;
        }
        if (typeof prop === "string") {
            return target.get(prop, 'N/A');
        }
    },
});