import { AuthRepository } from '@/modules/auth/application/ports/auth.repository';

export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(sessionId: string): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required');
    }

    try {
      await this.authRepository.logout(sessionId);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Logout failed. Please try again.');
    }
  }
}