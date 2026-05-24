import {
  Controller, Get, Post, Patch, Param, Query, Body, Req,
  UseGuards, ForbiddenException, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../conversation/conversation.service';
import { ChannelService } from '../channel/channel.service';
import { AgentService } from '../agent/agent.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('api')
@UseGuards(SupabaseAuthGuard)
export class ApiController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly channelService: ChannelService,
    private readonly agentService: AgentService,
  ) {}

  @Post('auth/profile')
  getProfile(@Req() req: any) {
    return req.agent;
  }

  @Get('conversations')
  async listConversations(
    @Query('status') status?: string,
    @Query('ownerType') ownerType?: string,
    @Query('agentId') agentId?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (ownerType) where.ownerType = ownerType;
    if (agentId) where.agentId = agentId;

    return this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { agent: true },
    });
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ) {
    return this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
  }

  @Post('conversations/:id/assign')
  async assignConversation(@Param('id') id: string, @Req() req: any) {
    return this.conversationService.assignAgent(id, req.agent.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: any,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    const message = await this.prisma.message.create({
      data: {
        conversationId: id,
        content: body.content,
        sender: 'agent',
        direction: 'outbound',
        type: 'text',
      },
    });

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
    @Body() body: { agentId: string },
    @Req() req: any,
  ) {
    if (req.agent.role !== 'supervisor' && req.agent.role !== 'admin') {
      throw new ForbiddenException('Only supervisors can reassign conversations');
    }
    return this.conversationService.assignAgent(id, body.agentId);
  }

  @Get('metrics')
  async getMetrics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [active, queued, aiHandled, humanHandled, closedToday] = await Promise.all([
      this.prisma.conversation.count({ where: { status: { not: 'encerrada' } } }),
      this.prisma.conversation.count({ where: { status: 'na_fila' } }),
      this.prisma.conversation.count({ where: { ownerType: 'ai', status: { not: 'encerrada' } } }),
      this.prisma.conversation.count({ where: { ownerType: 'agent', status: { not: 'encerrada' } } }),
      this.prisma.conversation.count({ where: { status: 'encerrada', closedAt: { gte: startOfDay } } }),
    ]);

    return { active, queued, aiHandled, humanHandled, closedToday };
  }

  @Patch('agents/me/status')
  async updateStatus(@Body() body: { availability: string }, @Req() req: any) {
    return this.agentService.setAvailability(req.agent.id, body.availability as any);
  }
}
