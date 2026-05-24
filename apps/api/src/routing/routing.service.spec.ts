import { Test, TestingModule } from '@nestjs/testing';
import { RoutingService } from './routing.service';
import { AGENT_PORT, AgentPort, AgentEntity, AgentAvailability, AgentRole } from '@motor100/shared';

function makeAgent(overrides: Partial<AgentEntity> = {}): AgentEntity {
  return {
    id: 'agent-1',
    name: 'Agent 1',
    email: 'agent1@test.com',
    role: AgentRole.ATTENDANT,
    availability: AgentAvailability.ONLINE,
    maxConcurrent: 5,
    ...overrides,
  };
}

describe('RoutingService', () => {
  let service: RoutingService;
  let agentPort: jest.Mocked<AgentPort>;

  beforeEach(async () => {
    agentPort = {
      findAvailable: jest.fn(),
      setAvailability: jest.fn(),
      getActiveConversationCount: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        { provide: AGENT_PORT, useValue: agentPort },
      ],
    }).compile();

    service = module.get(RoutingService);
  });

  it('selects online agent with lowest active conversation count', async () => {
    agentPort.findAvailable.mockResolvedValue([
      makeAgent({ id: 'agent-1', name: 'Busy' }),
      makeAgent({ id: 'agent-2', name: 'Free' }),
    ]);
    agentPort.getActiveConversationCount
      .mockResolvedValueOnce(3)  // agent-1: 3 active
      .mockResolvedValueOnce(1); // agent-2: 1 active

    const result = await service.assignBestAgent('conv-123');

    expect(result).toEqual({ assigned: true, agentId: 'agent-2' });
  });

  it('skips agents at maxConcurrent capacity', async () => {
    agentPort.findAvailable.mockResolvedValue([
      makeAgent({ id: 'agent-full', maxConcurrent: 2 }),
      makeAgent({ id: 'agent-free', maxConcurrent: 5 }),
    ]);
    agentPort.getActiveConversationCount
      .mockResolvedValueOnce(2)  // agent-full: at capacity (2/2)
      .mockResolvedValueOnce(1); // agent-free: has room (1/5)

    const result = await service.assignBestAgent('conv-123');

    expect(result).toEqual({ assigned: true, agentId: 'agent-free' });
  });

  it('returns not-assigned when no agents are online', async () => {
    agentPort.findAvailable.mockResolvedValue([]);

    const result = await service.assignBestAgent('conv-123');

    expect(result).toEqual({ assigned: false, reason: 'no_agent_available' });
  });

  it('returns not-assigned when all agents are at capacity', async () => {
    agentPort.findAvailable.mockResolvedValue([
      makeAgent({ id: 'agent-1', maxConcurrent: 2 }),
      makeAgent({ id: 'agent-2', maxConcurrent: 3 }),
    ]);
    agentPort.getActiveConversationCount
      .mockResolvedValueOnce(2)  // at capacity
      .mockResolvedValueOnce(3); // at capacity

    const result = await service.assignBestAgent('conv-123');

    expect(result).toEqual({ assigned: false, reason: 'all_agents_at_capacity' });
  });

  it('selects first eligible agent when load is tied', async () => {
    agentPort.findAvailable.mockResolvedValue([
      makeAgent({ id: 'agent-a' }),
      makeAgent({ id: 'agent-b' }),
      makeAgent({ id: 'agent-c' }),
    ]);
    agentPort.getActiveConversationCount
      .mockResolvedValueOnce(2)  // agent-a: 2
      .mockResolvedValueOnce(2)  // agent-b: 2
      .mockResolvedValueOnce(2); // agent-c: 2

    const result = await service.assignBestAgent('conv-123');

    expect(result.assigned).toBe(true);
    if (result.assigned) {
      expect(result.agentId).toBe('agent-a');
    }
  });
});
