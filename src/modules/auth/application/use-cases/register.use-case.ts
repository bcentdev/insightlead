import { AuthRepository, RegisterCredentials, AuthResult } from '@/modules/auth/application/ports/auth.repository';
import { passwordService } from '@/modules/auth/infrastructure/services/password.service';

export class RegisterUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<AuthResult> {
    const { email, password, name } = credentials;

    if (!email?.trim()) {
      throw new Error('Email is required');
    }

    if (!name?.trim()) {
      throw new Error('Name is required');
    }

    if (!password?.trim()) {
      throw new Error('Password is required');
    }

    // Validate password strength
    const passwordValidation = passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    try {
      const result = await this.authRepository.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim()
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  }
}