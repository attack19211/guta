// libs/env.lib.ts

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = (key: string, fallback?: any): any => {
    const value = process.env[key];

    if (value === undefined || value === null) {
        if (fallback !== undefined) {
            return fallback;
        }
        
        return null;
    }

    const trimmed = value.trim();

    if (trimmed === 'null' || trimmed === 'NULL') {
        return null;
    }

    if (trimmed === 'true' || trimmed === 'TRUE' || trimmed === '1') {
        return true;
    }
    if (trimmed === 'false' || trimmed === 'FALSE' || trimmed === '0') {
        return false;
    }

    if (/^-?\d+$/.test(trimmed)) {
        return parseInt(trimmed);
    }
    if (/^-?\d+\.\d+$/.test(trimmed)) {
        return parseFloat(trimmed);
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            return JSON.parse(trimmed);
        } catch {
        }
    }

    if (trimmed.includes(',')) {
        return trimmed.split(',').map(item => item.trim());
    }

    return trimmed;
};

export default env;