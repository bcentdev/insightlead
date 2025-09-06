import { v4 as uuidv4 } from 'uuid';

export type JWTPayload = {
  userId: string;
  sessionId: string;
  email: string;
  role: string;
  iat: number; // issued at
  exp: number; // expires at
};

export type TokenValidationResult = {
  userId: string;
  sessionId: string;
  email: string;
  role: string;
  isValid: boolean;
  isExpired: boolean;
};

// Simple JWT service for client-side usage
// For production, you'd want to use a proper JWT library and server-side validation
export class JWTService {
  private readonly secret: string;
  private readonly expirationTime: number; // in seconds

  constructor(secret?: string, expirationTime: number = 7 * 24 * 60 * 60) { // 7 days default
    this.secret = secret || 'insightlead-jwt-secret-' + Date.now();
    this.expirationTime = expirationTime;
  }

  // Simple base64 encoding for development/demo purposes
  // In production, use proper JWT signing
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + this.expirationTime
    };

    // Simple encoding - in production use proper JWT
    const header = this.base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signature = this.base64UrlEncode(this.simpleHash(header + '.' + payloadEncoded + this.secret));
    
    return `${header}.${payloadEncoded}.${signature}`;
  }

  validateToken(token: string): TokenValidationResult {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return this.createInvalidResult();
      }

      const [header, payload, signature] = parts;
      
      // Verify signature
      const expectedSignature = this.base64UrlEncode(
        this.simpleHash(header + '.' + payload + this.secret)
      );
      
      if (signature !== expectedSignature) {
        return this.createInvalidResult();
      }

      const decodedPayload: JWTPayload = JSON.parse(this.base64UrlDecode(payload));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = decodedPayload.exp < now;

      return {
        userId: decodedPayload.userId,
        sessionId: decodedPayload.sessionId,
        email: decodedPayload.email,
        role: decodedPayload.role,
        isValid: !isExpired,
        isExpired
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return this.createInvalidResult();
    }
  }

  generateRefreshToken(): string {
    return uuidv4() + '-' + Date.now() + '-' + Math.random().toString(36).substring(2);
  }

  isTokenExpired(token: string): boolean {
    const result = this.validateToken(token);
    return result.isExpired;
  }

  getTokenPayload(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      return JSON.parse(this.base64UrlDecode(parts[1]));
    } catch {
      return null;
    }
  }

  private createInvalidResult(): TokenValidationResult {
    return {
      userId: '',
      sessionId: '',
      email: '',
      role: '',
      isValid: false,
      isExpired: true
    };
  }

  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    str += '='.repeat((4 - str.length % 4) % 4);
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }

  // Simple hash function for development - use proper HMAC in production
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Singleton instance
export const jwtService = new JWTService();