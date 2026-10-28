export class MessageBag {
    private errors: Record<string, string[]> = {};

    constructor(errors: Record<string, string[]> = {}) {
        this.errors = errors;
    }

    public add(field: string, message: string): void {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    }

    public has(field: string): boolean {
        return !!this.errors[field] && this.errors[field].length > 0;
    }

    public first(field?: string): string | null {
        if (field) {
            return this.errors[field]?.[0] || null;
        }

        const firstKey = Object.keys(this.errors)[0];
        if (firstKey) {
            return this.errors[firstKey]?.[0] || null;
        }

        return null;
    }

    public get(field: string): string[] {
        return this.errors[field] || [];
    }

    public all(): Record<string, string[]> {
        return this.errors;
    }

    public isEmpty(): boolean {
        return Object.keys(this.errors).length === 0;
    }
}