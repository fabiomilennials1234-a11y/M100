import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentAvailability } from '@motor100/shared';

@Controller('agents')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Get('available')
  findAvailable() {
    return this.service.findAvailable();
  }

  @Patch(':id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body() body: { availability: AgentAvailability },
  ) {
    return this.service.setAvailability(id, body.availability);
  }
}
