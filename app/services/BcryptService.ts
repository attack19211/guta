import crypto from 'crypto';
import env from '@/libs/env.lib';

export class CryptoService {
    /**
     * Lấy Private Key từ ENV (xử lý xuống dòng \n nếu có)
     */
    private static getRsaPrivateKey(): string {
        const rawKey = env("APP_JWT_PRIVATE_KEY", "");
        return rawKey.replace(/\\n/g, '\n');
    }

    /**
     * Lấy Public Key từ ENV (xử lý xuống dòng \n nếu có)
     */
    private static getRsaPublicKey(): string {
        const rawKey = env("APP_JWT_PUBLIC_KEY", "");
        return rawKey.replace(/\\n/g, '\n');
    }

    /**
     * RSA Encrypt: Mã hóa bằng Public Key
     */
    public static rsaEncrypt(text: string): string {
        const publicKey = this.getRsaPublicKey();
        const buffer = Buffer.from(text, 'utf8');
        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buffer
        );
        return encrypted.toString('base64');
    }

    /**
     * RSA Decrypt: Giải mã bằng Private Key (Sử dụng Key trong .env của ông)
     */
    public static rsaDecrypt(encryptedBase64: string): string {
        const privateKey = this.getRsaPrivateKey();
        const buffer = Buffer.from(encryptedBase64, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buffer
        );
        return decrypted.toString('utf8');
    }

    /**
     * Tạo Cặp khóa ECC (Elliptic Curve - Curve secp256r1 / prime256v1)
     */
    public static generateEccKeyPair() {
        return crypto.generateKeyPairSync('ec', {
            namedCurve: 'prime256v1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
    }

    /**
     * Mã hóa dữ liệu bằng ECC Public Key (ECDH Ephemeral + AES-256-GCM)
     */
    public static eccEncrypt(text: string, recipientPublicKeyPem: string): string {
        const ephemeralKey = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

        const recipientPublicKey = crypto.createPublicKey(recipientPublicKeyPem);
        const sharedSecret = crypto.diffieHellman({
            privateKey: ephemeralKey.privateKey,
            publicKey: recipientPublicKey,
        });

        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret.subarray(0, 32), iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        const ephemeralPubKeyPem = ephemeralKey.publicKey.export({ type: 'spki', format: 'pem' }) as string;

        const payload = {
            ephemeralPublicKey: ephemeralPubKeyPem,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            ciphertext: encrypted,
        };

        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    /**
     * Giải mã dữ liệu bằng ECC Private Key
     */
    public static eccDecrypt(encryptedPayloadBase64: string, recipientPrivateKeyPem: string): string {
        const jsonStr = Buffer.from(encryptedPayloadBase64, 'base64').toString('utf8');
        const payload = JSON.parse(jsonStr);

        const ephemeralPublicKey = crypto.createPublicKey(payload.ephemeralPublicKey);
        const recipientPrivateKey = crypto.createPrivateKey(recipientPrivateKeyPem);

        const sharedSecret = crypto.diffieHellman({
            privateKey: recipientPrivateKey,
            publicKey: ephemeralPublicKey,
        });

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            sharedSecret.subarray(0, 32),
            Buffer.from(payload.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

        let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}