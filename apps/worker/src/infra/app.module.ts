import { Module } from '@nestjs/common'

import { DocumentProcessingModule } from './document-processing/document-processing.module.js'
import { EnvModule } from './env/env.module.js'

@Module({
  imports: [
    EnvModule,
    DocumentProcessingModule,
  ],
})
export class AppModule {}
