import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, RoutingPort, RoutingResult, AgentPort, AGENT_PORT } from '@motor100/shared';

@Injectable()
export class RoutingService implements RoutingPort {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    @Inject(AGENT_PORT) private readonly agentPort: AgentPort,
  ) {}

  async assignBestAgent(conversationId: string): Promise<RoutingResult> {
    const agents = await this.agentPort.findAvailable();

    if (agents.length === 0) {
      return { assigned: false, reason: 'no_agent_available' };
    }

    const agentLoads = await Promise.all(
      agents.map(async (agent) => ({
        agent,
        activeCount: await this.agentPort.getActiveConversationCount(agent.id),
      })),
    );

    const eligible = agentLoads.filter(
      ({ agent, activeCount }) => activeCount < agent.maxConcurrent,
    );

    if (eligible.length === 0) {
      return { assigned: false, reason: 'all_agents_at_capacity' };
    }

    eligible.sort((a, b) => a.activeCount - b.activeCount);

    return { assigned: true, agentId: eligible[0].agent.id };
  }

  @OnEvent(DomainEvent.HANDOFF_REQUESTED)
  async handleHandoff(payload: { conversation: any }) {
    this.logger.log(`Handoff requested for conversation ${payload.conversation.id}`);
  }
}
