import { Test, TestingModule } from '@nestjs/testing';
import { ApiController } from './api.controller';
import { ConversationService } from '../conversation/conversation.service';
import { ChannelService } from '../channel/channel.service';
import { AgentService } from '../agent/agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ForbiddenException } from '@nestjs/common';

describe('ApiController', () => {
  let controller: ApiController;
  let mockPrisma: any;
  let mockConversationService: any;
  let mockChannelService: any;
  let mockAgentService: any;

  beforeEach(async () => {
    mockPrisma = {
      conversation: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'conv-1', externalPhone: '+5511999990000', status: 'na_fila', ownerType: 'queue' },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1', externalPhone: '+5511999990000', status: 'atendida_humano',
          progressiveSummary: 'Resumo progressivo', finalSummary: null,
        }),
        count: jest.fn().mockResolvedValue(10),
      },
      message: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'msg-1', content: 'Oi', sender: 'customer', direction: 'inbound', createdAt: new Date() },
        ]),
        create: jest.fn().mockResolvedValue({ id: 'msg-new' }),
      },
    };

    mockConversationService = {
      assignAgent: jest.fn().mockResolvedValue({ id: 'conv-1', status: 'atendida_humano' }),
      returnToAi: jest.fn().mockResolvedValue({ id: 'conv-1', status: 'atendida_ia' }),
      close: jest.fn().mockResolvedValue({ id: 'conv-1', status: 'encerrada' }),
      transition: jest.fn().mockResolvedValue({ id: 'conv-1' }),
    };

    mockChannelService = {
      send: jest.fn().mockResolvedValue({ externalId: 'ext-1' }),
    };

    mockAgentService = {
      setAvailability: jest.fn().mockResolvedValue({ id: 'agent-1', availability: 'online' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: ChannelService, useValue: mockChannelService },
        { provide: AgentService, useValue: mockAgentService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ApiController);
  });

  afterEach(() => jest.clearAllMocks());

  const mockAgent = (role = 'attendant') => ({ id: 'agent-1', name: 'João', email: 'joao@m100.com', role });
  const mockReq = (role = 'attendant') => ({ agent: mockAgent(role) });

  it('GET /conversations returns filtered list', async () => {
    const result = await controller.listConversations('na_fila', undefined, undefined);
    expect(result).toHaveLength(1);
    expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'na_fila' }),
      }),
    );
  });

  it('GET /conversations/:id returns conversation with summary', async () => {
    const result = await controller.getConversation('conv-1');
    expect(result!.progressiveSummary).toBe('Resumo progressivo');
  });

  it('GET /conversations/:id/messages returns paginated', async () => {
    const result = await controller.getMessages('conv-1', 20, 0);
    expect(result).toHaveLength(1);
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: 'conv-1' },
        take: 20,
      }),
    );
  });

  it('POST /conversations/:id/assign transitions to atendida_humano', async () => {
    const result = await controller.assignConversation('conv-1', mockReq());
    expect(mockConversationService.assignAgent).toHaveBeenCalledWith('conv-1', 'agent-1');
    expect(result.status).toBe('atendida_humano');
  });

  it('POST /conversations/:id/messages sends via ChannelService', async () => {
    mockPrisma.conversation.findUnique.mockResolvedValueOnce({
      id: 'conv-1', externalPhone: '+5511999990000',
    });

    await controller.sendMessage('conv-1', { content: 'Olá cliente' }, mockReq());

    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        content: 'Olá cliente',
        sender: 'agent',
        direction: 'outbound',
      }),
    });
    expect(mockChannelService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+5511999990000',
        content: 'Olá cliente',
      }),
    );
  });

  it('POST /conversations/:id/return-to-ai transitions', async () => {
    await controller.returnToAi('conv-1');
    expect(mockConversationService.returnToAi).toHaveBeenCalledWith('conv-1');
  });

  it('POST /conversations/:id/close transitions', async () => {
    await controller.closeConversation('conv-1');
    expect(mockConversationService.close).toHaveBeenCalledWith('conv-1');
  });

  it('GET /metrics returns aggregated counts', async () => {
    mockPrisma.conversation.count
      .mockResolvedValueOnce(25) // active
      .mockResolvedValueOnce(3)  // queued
      .mockResolvedValueOnce(15) // ai
      .mockResolvedValueOnce(7)  // human
      .mockResolvedValueOnce(12); // closed today

    const result = await controller.getMetrics();

    expect(result).toEqual(expect.objectContaining({
      active: 25,
      queued: 3,
      aiHandled: 15,
      humanHandled: 7,
      closedToday: 12,
    }));
  });

  it('POST /conversations/:id/reassign rejects non-supervisor', async () => {
    await expect(
      controller.reassignConversation('conv-1', { agentId: 'agent-2' }, mockReq('attendant')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('POST /conversations/:id/reassign works for supervisor', async () => {
    await controller.reassignConversation('conv-1', { agentId: 'agent-2' }, mockReq('supervisor'));
    expect(mockConversationService.assignAgent).toHaveBeenCalledWith('conv-1', 'agent-2');
  });
});
