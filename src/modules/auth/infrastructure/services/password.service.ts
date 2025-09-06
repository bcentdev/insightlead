// Simple password hashing service for client-side usage
// For production, use proper server-side hashing with bcrypt or similar

export class PasswordService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 12) {
    this.saltRounds = saltRounds;
  }

  async hashPassword(password: string): Promise<string> {
    // Simple client-side hashing for demo purposes
    // In production, this should be done server-side with proper bcrypt
    const salt = this.generateSalt();
    const hashedPassword = await this.hashWithSalt(password, salt);
    return `${salt}:${hashedPassword}`;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const verifyHash = await this.hashWithSalt(password, salt);
      return hash === verifyHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-5
  } {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      errors.push('Password must contain at least one number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      score += 1;
    } else {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 5)
    };
  }

  private generateSalt(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async hashWithSalt(password: string, salt: string): Promise<string> {
    // Simple hash function using Web Crypto API
    // In production, use proper server-side bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
}

// Singleton instance
export const passwordService = new PasswordService();