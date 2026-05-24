export interface RealtimePort {
  broadcast(event: string, payload: unknown): void;
  sendToAgent(agentId: string, event: string, payload: unknown): void;
}
