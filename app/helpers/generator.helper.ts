// helpers/generator.helper.ts

import crypto from 'crypto';

export const generateRandomNumber = async (length: number): Promise<number> => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateRandomLetter = async (length: number): Promise<string> => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        result += letters.charAt(randomIndex);
    }
    return result;
};

export const generateRandomString = async (length: number): Promise<string> => {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
};

export const generateText = (name: string): string => {
    const words = name.split(' ');
    let initials = '';
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word && word.length > 0) {
            initials += word.charAt(0).toUpperCase();
        }
    }
    return initials;
};

export const generateSnowflakeId = (): bigint => {
    const epoch = 1420070400000n;
    const timestamp = BigInt(Date.now()) - epoch;
    const random = BigInt(Math.floor(Math.random() * (1 << 22)));
    return (timestamp << 22n) | random;
};

export const generateCode = (): string => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const SSS = String(now.getMilliseconds()).padStart(3, "0");
    return `${yy}${MM}${dd}${HH}${mm}${ss}${SSS}`;
};

export const generateUUID = (): string => {
    return crypto.randomUUID();
};

export const generatePrivateKey = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

export const generateHexCode = (bytes: number = 16): string => {
    return crypto.randomBytes(bytes).toString('hex');
};