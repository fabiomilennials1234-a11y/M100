export type RoutingResult =
  | { assigned: true; agentId: string }
  | { assigned: false; reason: string };

export interface RoutingPort {
  assignBestAgent(conversationId: string): Promise<RoutingResult>;
}
