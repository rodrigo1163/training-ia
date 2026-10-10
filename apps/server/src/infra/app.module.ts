import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth.js';
import { DatabaseModule } from './database/database.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    DatabaseModule
  ],
})
export class AppModule { }
