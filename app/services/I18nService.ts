import fs from 'fs';
import path from 'path';

type Dict = Record<string, string | Record<string, any>>;

export class I18nService {
    private static instance: I18nService;

    private cache = new Map<string, Dict>();
    private watchers: fs.FSWatcher[] = [];
    private defaultLocale = 'vi';
    private fallbackLocale = 'en';
    private baseDir: string;
    private watchEnabled: boolean;
    private debounceTimers = new Map<string, NodeJS.Timeout>();

    private constructor() {
        this.baseDir = path.join(process.cwd(), 'language');
        this.watchEnabled = process.env.NODE_ENV !== 'production';
        this.startWatching();
    }

    public static getInstance(): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService();
        }
        return I18nService.instance;
    }

    private startWatching(): void {
        if (!this.watchEnabled) return;

        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }

        try {
            const watcher = fs.watch(this.baseDir, { recursive: true }, (event, filename) => {
                if (!filename) return;
                this.onFileChanged(filename.toString());
            });
            watcher.on('error', (err) => {});
            this.watchers.push(watcher);
        } catch (err) { }
    }

    private onFileChanged(filename: string): void {
        const normalized = filename.replace(/\\/g, '/');
        if (!normalized.endsWith('.json')) return;

        const parts = normalized.split('/');
        if (parts.length < 2) return;

        const locale = parts[0]!;
        const namespace = parts[1]!.replace(/\.json$/, '');
        const key = `${locale}.${namespace}`;

        const prev = this.debounceTimers.get(key);
        if (prev) clearTimeout(prev);

        const timer = setTimeout(() => {
            this.debounceTimers.delete(key);
            this.reload(namespace, locale);
        }, 80);
        this.debounceTimers.set(key, timer);
    }

    private readFile(locale: string, namespace: string): Dict {
        const filePath = path.join(this.baseDir, locale, `${namespace}.json`);
        try {
            if (!fs.existsSync(filePath)) return {};
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        } catch (err) {
            return {};
        }
    }

    private load(locale: string, namespace: string): Dict {
        const key = `${locale}.${namespace}`;
        if (this.cache.has(key)) return this.cache.get(key)!;

        const data = this.readFile(locale, namespace);
        this.cache.set(key, data);
        return data;
    }

    public t(key: string, locale?: string, params?: Record<string, string | number>): string {
        const [namespace, ...rest] = key.split('.');
        if (!namespace) return key;
        const pathKey = rest.join('.');

        const locales = Array.from(
            new Set(
                [locale, this.defaultLocale, this.fallbackLocale].filter(Boolean) as string[]
            )
        );

        for (const loc of locales) {
            const dict = this.load(loc, namespace);
            const value = this.pick(dict, pathKey);
            if (typeof value === 'string') {
                return this.interpolate(value, params);
            }
        }
        return key;
    }

    private pick(obj: Dict, pathKey: string): any {
        if (!pathKey) return obj;
        return pathKey
            .split('.')
            .reduce<any>(
                (acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined),
                obj
            );
    }

    private interpolate(text: string, params?: Record<string, string | number>): string {
        if (!params) return text;
        return text.replace(/\{(\w+)\}/g, (_, k) =>
            params[k] !== undefined ? String(params[k]) : `{${k}}`
        );
    }

    public reload(namespace?: string, locale?: string): void {
        if (!namespace) {
            this.cache.clear();
            return;
        }

        if (locale) {
            const key = `${locale}.${namespace}`;
            this.cache.delete(key);
            return;
        }

        for (const key of this.cache.keys()) {
            if (key.endsWith(`.${namespace}`)) {
                this.cache.delete(key);
            }
        }
    }

    public clear(): void {
        this.cache.clear();
    }

    public setDefaultLocale(locale: string): void {
        this.defaultLocale = locale;
    }

    public dispose(): void {
        for (const t of this.debounceTimers.values()) clearTimeout(t);
        this.debounceTimers.clear();
        for (const w of this.watchers) w.close();
        this.watchers = [];
        this.cache.clear();
    }
}