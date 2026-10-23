import { Module } from '@nestjs/common';
import { Uploader } from '@/domain/application/storage/uploader';
import { DocumentStorage } from '@/domain/application/storage/document-storage';
import { EnvModule } from '@/infra/env/env.module';
import { R2Storage } from './r2-storage';

@Module({
  imports: [EnvModule],
  providers: [
    R2Storage,
    {
      provide: Uploader,
      useExisting: R2Storage,
    },
    {
      provide: DocumentStorage,
      useExisting: R2Storage,
    },
  ],
  exports: [Uploader, DocumentStorage],
})
export class StorageModule { }
