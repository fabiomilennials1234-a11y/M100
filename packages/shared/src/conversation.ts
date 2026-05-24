export enum ConversationStatus {
  NOVA = 'nova',
  ATENDIDA_IA = 'atendida_ia',
  NA_FILA = 'na_fila',
  ATENDIDA_HUMANO = 'atendida_humano',
  ENCERRADA = 'encerrada',
}

export const VALID_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  [ConversationStatus.NOVA]: [ConversationStatus.ATENDIDA_IA],
  [ConversationStatus.ATENDIDA_IA]: [ConversationStatus.NA_FILA, ConversationStatus.ENCERRADA],
  [ConversationStatus.NA_FILA]: [ConversationStatus.ATENDIDA_HUMANO],
  [ConversationStatus.ATENDIDA_HUMANO]: [ConversationStatus.ATENDIDA_IA, ConversationStatus.ENCERRADA],
  [ConversationStatus.ENCERRADA]: [ConversationStatus.NOVA],
};

export function isValidTransition(from: ConversationStatus, to: ConversationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export enum OwnerType {
  AI = 'ai',
  AGENT = 'agent',
  QUEUE = 'queue',
  NONE = 'none',
}

export interface ConversationOwner {
  type: OwnerType;
  agentId?: string;
}

export const STATUS_OWNER_MAP: Record<ConversationStatus, OwnerType> = {
  [ConversationStatus.NOVA]: OwnerType.NONE,
  [ConversationStatus.ATENDIDA_IA]: OwnerType.AI,
  [ConversationStatus.NA_FILA]: OwnerType.QUEUE,
  [ConversationStatus.ATENDIDA_HUMANO]: OwnerType.AGENT,
  [ConversationStatus.ENCERRADA]: OwnerType.NONE,
};
