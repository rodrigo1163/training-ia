import {
  backendInfrastructureEnvSchema,
  type BackendInfrastructureEnv,
} from '@training-ia/contracts/env'

export const envSchema = backendInfrastructureEnvSchema

export type Env = BackendInfrastructureEnv
