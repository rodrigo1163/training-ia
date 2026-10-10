import {
  Global,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';

import { prisma } from './prisma.js';

@Injectable()
class PrismaLifecycle implements OnApplicationShutdown {
  constructor(private readonly client: PrismaClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: prisma,
    },
    PrismaLifecycle,
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}
