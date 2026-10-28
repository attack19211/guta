import { MessageBag } from './MessageBag';
import { RulesRegistry } from './RulesRegistry';

export class Validator {
    private data: Record<string, any>;
    private rules: Record<string, any>;
    private customMessages: Record<string, string>;
    private messageBag: MessageBag;

    constructor(
        data: Record<string, any>,
        rules: Record<string, any>,
        messages: Record<string, string> = {}
    ) {
        this.data = data;
        this.rules = rules;
        this.customMessages = messages;
        this.messageBag = new MessageBag();
    }

    public static make(
        data: Record<string, any>,
        rules: Record<string, any>,
        messages: Record<string, string> = {}
    ): Validator {
        return new Validator(data, rules, messages);
    }

    public static async validate(
        data: Record<string, any>,
        rules: Record<string, any>,
        messages: Record<string, string> = {}
    ): Promise<Validator> {
        const instance = new Validator(data, rules, messages);
        await instance.validate();
        return instance;
    }

    public static extend(ruleName: string, handler: any, defaultMessageResolver?: any) {
        RulesRegistry[ruleName] = {
            handler,
            defaultMessage: defaultMessageResolver || ((f: string) => `Trường ${f} không hợp lệ.`)
        };
    }

    public async validate(): Promise<boolean> {
        this.messageBag = new MessageBag();

        for (const field of Object.keys(this.rules)) {
            const rawRules = this.rules[field];
            const ruleList = Array.isArray(rawRules) ? rawRules : rawRules.split('|');
            const value = this.data[field];

            if (ruleList.includes('sometimes') && !(field in this.data)) {
                continue;
            }

            for (const ruleItem of ruleList) {
                let ruleName = '';
                let params: string[] = [];

                if (typeof ruleItem === 'string') {
                    const parts = ruleItem.split(':');
                    const name = parts[0];
                    if (name) {
                        ruleName = name.trim();
                    }
                    const paramParts = parts.slice(1);
                    params = paramParts.length > 0 ? paramParts.join(':').split(',') : [];
                }

                if (ruleList.includes('nullable') && (value === undefined || value === null || value === '')) {
                    break;
                }

                const isPresenceRule = ruleName.startsWith('required') || ruleName.startsWith('present') || ruleName.startsWith('missing') || ruleName.startsWith('prohibited') || ruleName === 'accepted';

                if (!isPresenceRule && (value === undefined || value === null || value === '')) {
                    continue;
                }

                const targetRule = RulesRegistry[ruleName];
                if (!targetRule) {
                    continue;
                }

                const passed = await targetRule.handler(value, params, this.data, field);

                if (!passed) {
                    const customKey = `${field}.${ruleName}`;
                    const errorMessage =
                        this.customMessages[customKey] ||
                        this.customMessages[field] ||
                        targetRule.defaultMessage(field, params);

                    this.messageBag.add(field, errorMessage);
                    
                    if (ruleList.includes('bail') || true) {
                        break;
                    }
                }
            }
        }

        return this.messageBag.isEmpty();
    }

    public fails(): boolean {
        return !this.messageBag.isEmpty();
    }

    public errors(): MessageBag {
        return this.messageBag;
    }
}