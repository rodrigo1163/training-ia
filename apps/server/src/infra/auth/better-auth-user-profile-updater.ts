import { Injectable } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { UserProfileUpdater } from '@/domain/application/auth/user-profile-updater';
import type { TrainingAuth } from './auth';

@Injectable()
export class BetterAuthUserProfileUpdater extends UserProfileUpdater {
  constructor(private readonly authService: AuthService<TrainingAuth>) {
    super();
  }

  async updateImage({ image, headers }: { image: string; headers: Headers }) {
    const result = await this.authService.api.updateUser({
      body: { image },
      headers,
      returnHeaders: true,
    });

    return { headers: result.headers };
  }
}
