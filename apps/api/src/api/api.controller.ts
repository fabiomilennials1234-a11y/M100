import {
  Controller, Get, Post, Patch, Param, Query, Body, Req, Inject,
  UseGuards, ForbiddenException, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import {
  CONVERSATION_PORT, CHANNEL_PORT, AGENT_PORT,
  ConversationPort, ChannelSender, AgentPort,
} from '@motor100/shared';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SendMessageDto, ReassignDto, UpdateAvailabilityDto, ConversationFilterDto } from './dto';

@Controller('api')
@UseGuards(SupabaseAuthGuard)
export class ApiController {
  constructor(
    @Inject(CONVERSATION_PORT) private readonly conversation: ConversationPort,
    @Inject(CHANNEL_PORT) private readonly channel: ChannelSender,
    @Inject(AGENT_PORT) private readonly agent: AgentPort,
  ) {}

  @Post('auth/profile')
  getProfile(@Req() req: any) {
    return req.agent;
  }

  @Get('conversations')
  async listConversations(@Query() filter: ConversationFilterDto) {
    return this.conversation.findMany(filter);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    return this.conversation.findById(id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ) {
    return this.conversation.getMessages(id, take, skip);
  }

  @Post('conversations/:id/assign')
  async assignConversation(@Param('id') id: string, @Req() req: any) {
    return this.conversation.assignAgent(id, req.agent.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: SendMessageDto,
    @Req() req: any,
  ) {
    const message = await this.conversation.handleOutboundMessage(id, body.content, 'agent');
    const conversation = await this.conversation.findById(id);
    await this.channel.send({
      to: conversation!.externalPhone,
      content: body.content,
      type: 'text',
    });
    return message;
  }

  @Post('conversations/:id/return-to-ai')
  async returnToAi(@Param('id') id: string) {
    return this.conversation.returnToAi(id);
  }

  @Post('conversations/:id/close')
  async closeConversation(@Param('id') id: string) {
    return this.conversation.close(id);
  }

  @Post('conversations/:id/reassign')
  async reassignConversation(
    @Param('id') id: string,
    @Body() body: ReassignDto,
    @Req() req: any,
  ) {
    if (req.agent.role !== 'supervisor' && req.agent.role !== 'admin') {
      throw new ForbiddenException('Only supervisors can reassign conversations');
    }
    return this.conversation.assignAgent(id, body.agentId);
  }

  @Get('metrics')
  async getMetrics() {
    return this.conversation.getMetrics();
  }

  @Patch('agents/me/status')
  async updateStatus(@Body() body: UpdateAvailabilityDto, @Req() req: any) {
    return this.agent.setAvailability(req.agent.id, body.availability);
  }
}
