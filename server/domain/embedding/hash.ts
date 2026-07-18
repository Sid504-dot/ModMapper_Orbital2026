import crypto from 'crypto';

export function sha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}


export function compareHashes(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
}

