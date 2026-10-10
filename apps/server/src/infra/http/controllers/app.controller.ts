import { Controller, Get } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'

@Controller()
@AllowAnonymous()
export class AppController {
  @Get()
  getHello() {
    return 'Hello World!'
  }
}
