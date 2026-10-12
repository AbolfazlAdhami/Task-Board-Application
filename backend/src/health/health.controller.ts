import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @SkipThrottle()
  @HealthCheck()
  async check() {
    try {
      await this.health.check([
        () => this.database.pingCheck('database').withTimeout(1000),
      ]);

      return {
        status: 'ok',
        checks: { application: 'up', database: 'up' },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { application: 'up', database: 'down' },
      });
    }
  }
}
