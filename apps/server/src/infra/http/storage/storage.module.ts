import { Module } from '@nestjs/common';
import { Uploader } from '@/domain/application/storage/uploader';
import { EnvModule } from '@/infra/env/env.module';
import { R2Storage } from './r2-storage.js';

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: Uploader,
      useClass: R2Storage,
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
