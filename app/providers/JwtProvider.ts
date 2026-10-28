import jwt, { Secret, SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '@/libs/env.lib';

export class JwtException extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 401
    ) {
        super(message);
        this.name = 'JwtException';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const JwtErrorCode = {
    MISSING_KEY: 'JWT_CONFIG_ERR_01',
    EXPIRED: 'JWT_AUTH_EXPIRED',
    INVALID_SIGNATURE: 'JWT_AUTH_INVALID_SIGNATURE',
    MALFORMED: 'JWT_AUTH_MALFORMED',
    NOT_BEFORE: 'JWT_AUTH_NOT_BEFORE',
    UNAUTHORIZED: 'JWT_AUTH_FAILED',
} as const;

const parseKey = (key?: string): string => {
    if (!key) return '';
    return key.replace(/\\n/g, '\n').trim();
};

const PRIVATE_KEY = parseKey(env("APP_JWT_PRIVATE_KEY")) as Secret;
const PUBLIC_KEY = parseKey(env("APP_JWT_PUBLIC_KEY")) as Secret;

const DEFAULT_ACCESS_EXPIRES_IN = env("APP_JWT_EXPIRES_IN") || "15m";
const DEFAULT_REFRESH_EXPIRES_IN = env("APP_JWT_REFRESH_EXPIRES_IN") || "7d";
const BASE_ISSUER = env("APP_JWT_ISSUER") || env("APP_JWT_SECRET_KEY") || "iuSuHYVufIUuNIREV0FB9EoLn9kHsDbm";

export interface StandardJwtPayload extends JwtPayload {
    jti?: string;
    iss?: string;
    identity?: any;
    type?: 'access' | 'refresh';
    [key: string]: any;
}

export interface JwtSignOptions {
    expiresIn?: string | number;
    type?: 'access' | 'refresh';
    jti?: string;
}

export const JwtProvider = {
    sign: (payload: object, options: JwtSignOptions = {}): string => {
        if (!PRIVATE_KEY) {
            throw new JwtException(JwtErrorCode.MISSING_KEY, 'Cấu hình hệ thống lỗi: Mã khóa riêng tư (Private Key) bị thiếu.', 500);
        }

        const tokenType = options.type || 'access';
        const defaultExpiresIn = tokenType === 'access' ? DEFAULT_ACCESS_EXPIRES_IN : DEFAULT_REFRESH_EXPIRES_IN;
        const expiresIn = options.expiresIn || defaultExpiresIn;

        const issuer = tokenType === 'refresh' ? `refresh_${BASE_ISSUER}` : BASE_ISSUER;
        const jti = options.jti || randomUUID();

        const signOptions: SignOptions = {
            algorithm: 'RS256',
            expiresIn: expiresIn as SignOptions['expiresIn'],
            issuer,
            jwtid: jti
        };

        const customPayload = {
            ...payload,
            type: tokenType
        };

        try {
            return jwt.sign(customPayload, PRIVATE_KEY, signOptions);
        } catch (error: any) {
            throw new JwtException(JwtErrorCode.UNAUTHORIZED, `Lỗi khởi tạo mã xác thực: ${error.message}`, 500);
        }
    },

    verify: <T extends StandardJwtPayload = StandardJwtPayload>(token: string): T => {
        if (!PUBLIC_KEY) {
            throw new JwtException(JwtErrorCode.MISSING_KEY, 'Cấu hình hệ thống lỗi: Mã khóa công khai (Public Key) bị thiếu.', 500);
        }

        if (!token) {
            throw new JwtException(JwtErrorCode.MALFORMED, 'Mã xác thực (Token) không được để trống.', 401);
        }

        const verifyOptions: VerifyOptions = {
            algorithms: ['RS256']
        };

        try {
            return jwt.verify(token, PUBLIC_KEY, verifyOptions) as T;
        } catch (error: any) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new JwtException(JwtErrorCode.EXPIRED, 'Mã xác thực đã hết hạn. Vui lòng đăng nhập lại hoặc làm mới token.', 401);
            }
            if (error instanceof jwt.JsonWebTokenError) {
                if (error.message.includes('signature')) {
                    throw new JwtException(JwtErrorCode.INVALID_SIGNATURE, 'Mã xác thực không hợp lệ (Chữ ký không đúng).', 401);
                }
                throw new JwtException(JwtErrorCode.MALFORMED, 'Mã xác thực không đúng định dạng chuẩn JWT.', 401);
            }
            if (error instanceof jwt.NotBeforeError) {
                throw new JwtException(JwtErrorCode.NOT_BEFORE, 'Mã xác thực chưa đến thời gian có hiệu lực.', 401);
            }

            throw new JwtException(JwtErrorCode.UNAUTHORIZED, 'Xác thực mã thất bại.', 401);
        }
    },

    decode: <T extends StandardJwtPayload = StandardJwtPayload>(token: string): T | null => {
        try {
            return jwt.decode(token) as T;
        } catch {
            return null;
        }
    }
};