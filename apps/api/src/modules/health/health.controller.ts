import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  health() {
    return this.service.health();
  }
}
