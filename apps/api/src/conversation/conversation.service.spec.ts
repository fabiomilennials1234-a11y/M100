import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationStatus, DomainEvent } from '@motor100/shared';

describe('ConversationService — event emission', () => {
  let service: ConversationService;
  let events: EventEmitter2;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      conversation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(ConversationService);
    events = module.get(EventEmitter2);
  });

  afterEach(() => jest.clearAllMocks());

  it('links a newly created conversation to its originating channel instance', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue(null);
    mockPrisma.conversation.create.mockResolvedValue({
      id: 'conv-1', externalPhone: '5511999', instanceId: 'inst-vendas',
    });

    await service.findOrCreate('5511999', 'inst-vendas');

    expect(mockPrisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalPhone: '5511999',
          instanceId: 'inst-vendas',
        }),
      }),
    );
  });

  it('emits OWNER_CHANGED when ownerType changes during transition', async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1', status: 'atendida_ia', ownerType: 'ai', version: 1,
    });
    mockPrisma.conversation.update.mockResolvedValue({
      id: 'conv-1', status: 'na_fila', ownerType: 'queue', version: 2,
    });

    await service.transition('conv-1', ConversationStatus.NA_FILA);

    expect(events.emit).toHaveBeenCalledWith(
      DomainEvent.CONVERSATION_OWNER_CHANGED,
      expect.objectContaining({ from: 'ai', to: 'queue', conversationId: 'conv-1' }),
    );
  });

  it('does NOT emit OWNER_CHANGED when ownerType stays same (encerrada → nova)', async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1', status: 'encerrada', ownerType: 'none', version: 1,
    });
    mockPrisma.conversation.update.mockResolvedValue({
      id: 'conv-1', status: 'nova', ownerType: 'none', version: 2,
    });

    await service.transition('conv-1', ConversationStatus.NOVA);

    const ownerChangedCalls = (events.emit as jest.Mock).mock.calls.filter(
      (c: any[]) => c[0] === DomainEvent.CONVERSATION_OWNER_CHANGED,
    );
    expect(ownerChangedCalls).toHaveLength(0);
  });
});
