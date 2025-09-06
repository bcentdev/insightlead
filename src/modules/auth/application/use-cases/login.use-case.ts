import { AuthRepository, LoginCredentials, AuthResult } from '@/modules/auth/application/ports/auth.repository';

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    if (!email?.trim()) {
      throw new Error('Email is required');
    }

    if (!password?.trim()) {
      throw new Error('Password is required');
    }

    try {
      const result = await this.authRepository.login({
        email: email.toLowerCase().trim(),
        password
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }
}