import { Module } from '@nestjs/common';
import { R2Storage } from '@training-ia/storage';
import { Uploader } from '@/domain/application/storage/uploader';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: Uploader,
      inject: [EnvService],
      useFactory: (envService: EnvService) =>
        new R2Storage({
          accountId: envService.get('CLOUDFLARE_ACCOUNT_ID'),
          bucket: envService.get('AWS_BUCKET_NAME'),
          accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
        }),
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
