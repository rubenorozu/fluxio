import { jwtVerify } from 'jose';
import { Role } from './types';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
    throw new Error('JWT_SECRET is not set in the environment variables');
}
const key = new TextEncoder().encode(secretKey);

export async function verifyToken(token: string): Promise<{ userId: string; role: Role; tenantId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return {
            userId: payload.userId as string,
            role: payload.role as Role,
            tenantId: payload.tenantId as string,
        };
    } catch (e) {
        return null;
    }
}
