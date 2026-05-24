export enum AIAction {
  RESPOND = 'respond',
  HANDOFF = 'handoff',
}

export interface AIDecision {
  action: AIAction;
  reason: string;
  message?: string;
}
