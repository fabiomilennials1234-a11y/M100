import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentAvailability } from '@motor100/shared';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable() {
    return this.prisma.agent.findMany({
      where: { availability: 'online' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setAvailability(agentId: string, availability: AgentAvailability) {
    return this.prisma.agent.update({
      where: { id: agentId },
      data: { availability },
    });
  }

  async getActiveConversationCount(agentId: string): Promise<number> {
    return this.prisma.conversation.count({
      where: {
        agentId,
        status: 'atendida_humano',
      },
    });
  }

  async findById(agentId: string) {
    return this.prisma.agent.findUnique({ where: { id: agentId } });
  }
}
