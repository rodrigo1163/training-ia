import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EnvService } from './env.service.js'
import { envSchema } from './env.js'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: (config) => envSchema.parse(config),
		}),
	],
	providers: [EnvService],
	exports: [EnvService],
})
export class EnvModule {}
