import { Controller, Post, Param, Body, Get, Query } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationStatus } from '@motor100/shared';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Post('inbound')
  handleInbound(@Body() body: { phone: string; content: string; type?: string }) {
    return this.service.handleInboundMessage(body.phone, body.content, body.type);
  }

  @Post(':id/handoff')
  requestHandoff(@Param('id') id: string) {
    return this.service.requestHandoff(id);
  }

  @Post(':id/assign')
  assignAgent(@Param('id') id: string, @Body() body: { agentId: string }) {
    return this.service.assignAgent(id, body.agentId);
  }

  @Post(':id/return-to-ai')
  returnToAi(@Param('id') id: string) {
    return this.service.returnToAi(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }
}
