import { Module } from '@nestjs/common'
import { R2Storage } from '@training-ia/storage'

import { DocumentStorage } from '../../domain/application/storage/document-storage.js'
import { EnvModule } from '../env/env.module.js'
import { EnvService } from '../env/env.service.js'

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: DocumentStorage,
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
  exports: [DocumentStorage],
})
export class StorageModule {}
