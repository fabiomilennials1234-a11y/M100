import {
  Controller, Get, Post, Patch, Param, Query, Body, Req,
  UseGuards, ForbiddenException, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ConversationService } from '../conversation/conversation.service';
import { ChannelService } from '../channel/channel.service';
import { AgentService } from '../agent/agent.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SendMessageDto, ReassignDto, UpdateAvailabilityDto, ConversationFilterDto } from './dto';

@Controller('api')
@UseGuards(SupabaseAuthGuard)
export class ApiController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly channelService: ChannelService,
    private readonly agentService: AgentService,
  ) {}

  @Post('auth/profile')
  getProfile(@Req() req: any) {
    return req.agent;
  }

  @Get('conversations')
  async listConversations(@Query() filter: ConversationFilterDto) {
    return this.conversationService.findMany(filter);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    return this.conversationService.findById(id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ) {
    return this.conversationService.getMessages(id, take, skip);
  }

  @Post('conversations/:id/assign')
  async assignConversation(@Param('id') id: string, @Req() req: any) {
    return this.conversationService.assignAgent(id, req.agent.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: SendMessageDto,
    @Req() req: any,
  ) {
    const message = await this.conversationService.handleOutboundMessage(id, body.content, 'agent');
    const conversation = await this.conversationService.findById(id);
    await this.channelService.send({
      to: conversation!.externalPhone,
      content: body.content,
      type: 'text',
    });
    return message;
  }

  @Post('conversations/:id/return-to-ai')
  async returnToAi(@Param('id') id: string) {
    return this.conversationService.returnToAi(id);
  }

  @Post('conversations/:id/close')
  async closeConversation(@Param('id') id: string) {
    return this.conversationService.close(id);
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
    return this.conversationService.assignAgent(id, body.agentId);
  }

  @Get('metrics')
  async getMetrics() {
    return this.conversationService.getMetrics();
  }

  @Patch('agents/me/status')
  async updateStatus(@Body() body: UpdateAvailabilityDto, @Req() req: any) {
    return this.agentService.setAvailability(req.agent.id, body.availability);
  }
}
