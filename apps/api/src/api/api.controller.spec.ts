import { Test, TestingModule } from '@nestjs/testing';
import { ApiController } from './api.controller';
import { CONVERSATION_PORT, CHANNEL_PORT, AGENT_PORT } from '@motor100/shared';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ForbiddenException } from '@nestjs/common';

describe('ApiController', () => {
  let controller: ApiController;
  let mockConversationService: any;
  let mockChannelService: any;
  let mockAgentService: any;

  beforeEach(async () => {
    mockConversationService = {
      findMany: jest.fn().mockResolvedValue([
        { id: 'conv-1', externalPhone: '+5511999990000', status: 'na_fila', ownerType: 'queue' },
      ]),
      findById: jest.fn().mockResolvedValue({
        id: 'conv-1', externalPhone: '+5511999990000', status: 'atendida_humano',
        progressiveSummary: 'Resumo progressivo', finalSummary: null,
      }),
      getMessages: jest.fn().mockResolvedValue([
        { id: 'msg-1', content: 'Oi', sender: 'customer', direction: 'inbound', createdAt: new Date() },
      ]),
      getMetrics: jest.fn().mockResolvedValue({
        active: 25, queued: 3, aiHandled: 15, humanHandled: 7, closedToday: 12,
      }),
      handleOutboundMessage: jest.fn().mockResolvedValue({ id: 'msg-new' }),
      assignAgent: jest.fn().mockResolvedValue({ id: 'conv-1', status: 'atendida_humano' }),
      returnToAi: jest.fn().mockResolvedValue({ id: 'conv-1', status: 'atendida_ia' }),
      close: jest.fn().mockResolvedValue({ id: 'conv-1', status: 'encerrada' }),
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
        { provide: CONVERSATION_PORT, useValue: mockConversationService },
        { provide: CHANNEL_PORT, useValue: mockChannelService },
        { provide: AGENT_PORT, useValue: mockAgentService },
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

  it('GET /conversations delegates to conversationService.findMany', async () => {
    const result = await controller.listConversations({ status: 'na_fila' as any });
    expect(result).toHaveLength(1);
    expect(mockConversationService.findMany).toHaveBeenCalledWith({ status: 'na_fila' });
  });

  it('GET /conversations/:id delegates to conversationService.findById', async () => {
    const result = await controller.getConversation('conv-1');
    expect(result!.progressiveSummary).toBe('Resumo progressivo');
    expect(mockConversationService.findById).toHaveBeenCalledWith('conv-1');
  });

  it('GET /conversations/:id/messages delegates to conversationService.getMessages', async () => {
    const result = await controller.getMessages('conv-1', 20, 0);
    expect(result).toHaveLength(1);
    expect(mockConversationService.getMessages).toHaveBeenCalledWith('conv-1', 20, 0);
  });

  it('POST /conversations/:id/assign transitions to atendida_humano', async () => {
    const result = await controller.assignConversation('conv-1', mockReq());
    expect(mockConversationService.assignAgent).toHaveBeenCalledWith('conv-1', 'agent-1');
    expect(result.status).toBe('atendida_humano');
  });

  it('POST /conversations/:id/messages uses handleOutboundMessage + channelService', async () => {
    await controller.sendMessage('conv-1', { content: 'Olá cliente' }, mockReq());

    expect(mockConversationService.handleOutboundMessage).toHaveBeenCalledWith('conv-1', 'Olá cliente', 'agent');
    expect(mockConversationService.findById).toHaveBeenCalledWith('conv-1');
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

  it('GET /metrics delegates to conversationService.getMetrics', async () => {
    const result = await controller.getMetrics();

    expect(result).toEqual({
      active: 25, queued: 3, aiHandled: 15, humanHandled: 7, closedToday: 12,
    });
    expect(mockConversationService.getMetrics).toHaveBeenCalled();
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
