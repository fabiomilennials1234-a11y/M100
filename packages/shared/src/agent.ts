export enum AgentRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  ATTENDANT = 'attendant',
}

export enum AgentAvailability {
  ONLINE = 'online',
  AWAY = 'away',
  OFFLINE = 'offline',
}

export interface AgentEntity {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  availability: AgentAvailability;
  maxConcurrent: number;
}

export interface AgentPort {
  findAvailable(): Promise<AgentEntity[]>;
  setAvailability(agentId: string, availability: AgentAvailability): Promise<AgentEntity>;
  getActiveConversationCount(agentId: string): Promise<number>;
  findById(agentId: string): Promise<AgentEntity | null>;
}
