import {
  ConversationStatus,
  isValidTransition,
  VALID_TRANSITIONS,
  STATUS_OWNER_MAP,
  OwnerType,
} from '@motor100/shared';

describe('Conversation State Machine', () => {
  describe('valid transitions', () => {
    const validCases: [ConversationStatus, ConversationStatus][] = [
      [ConversationStatus.NOVA, ConversationStatus.ATENDIDA_IA],
      [ConversationStatus.ATENDIDA_IA, ConversationStatus.NA_FILA],
      [ConversationStatus.ATENDIDA_IA, ConversationStatus.ENCERRADA],
      [ConversationStatus.NA_FILA, ConversationStatus.ATENDIDA_HUMANO],
      [ConversationStatus.ATENDIDA_HUMANO, ConversationStatus.ATENDIDA_IA],
      [ConversationStatus.ATENDIDA_HUMANO, ConversationStatus.ENCERRADA],
      [ConversationStatus.ENCERRADA, ConversationStatus.NOVA],
    ];

    it.each(validCases)('%s → %s should be valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    const invalidCases: [ConversationStatus, ConversationStatus][] = [
      [ConversationStatus.NOVA, ConversationStatus.NA_FILA],
      [ConversationStatus.NOVA, ConversationStatus.ATENDIDA_HUMANO],
      [ConversationStatus.NOVA, ConversationStatus.ENCERRADA],
      [ConversationStatus.NOVA, ConversationStatus.NOVA],
      [ConversationStatus.ATENDIDA_IA, ConversationStatus.NOVA],
      [ConversationStatus.ATENDIDA_IA, ConversationStatus.ATENDIDA_HUMANO],
      [ConversationStatus.ATENDIDA_IA, ConversationStatus.ATENDIDA_IA],
      [ConversationStatus.NA_FILA, ConversationStatus.NOVA],
      [ConversationStatus.NA_FILA, ConversationStatus.ATENDIDA_IA],
      [ConversationStatus.NA_FILA, ConversationStatus.ENCERRADA],
      [ConversationStatus.NA_FILA, ConversationStatus.NA_FILA],
      [ConversationStatus.ATENDIDA_HUMANO, ConversationStatus.NOVA],
      [ConversationStatus.ATENDIDA_HUMANO, ConversationStatus.NA_FILA],
      [ConversationStatus.ATENDIDA_HUMANO, ConversationStatus.ATENDIDA_HUMANO],
      [ConversationStatus.ENCERRADA, ConversationStatus.ATENDIDA_IA],
      [ConversationStatus.ENCERRADA, ConversationStatus.NA_FILA],
      [ConversationStatus.ENCERRADA, ConversationStatus.ATENDIDA_HUMANO],
      [ConversationStatus.ENCERRADA, ConversationStatus.ENCERRADA],
    ];

    it.each(invalidCases)('%s → %s should be invalid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(false);
    });
  });

  describe('all states have defined transitions', () => {
    it('every ConversationStatus has an entry in VALID_TRANSITIONS', () => {
      for (const status of Object.values(ConversationStatus)) {
        expect(VALID_TRANSITIONS).toHaveProperty(status as string);
      }
    });
  });

  describe('owner type mapping', () => {
    it('NOVA → NONE', () => {
      expect(STATUS_OWNER_MAP[ConversationStatus.NOVA]).toBe(OwnerType.NONE);
    });

    it('ATENDIDA_IA → AI', () => {
      expect(STATUS_OWNER_MAP[ConversationStatus.ATENDIDA_IA]).toBe(OwnerType.AI);
    });

    it('NA_FILA → QUEUE', () => {
      expect(STATUS_OWNER_MAP[ConversationStatus.NA_FILA]).toBe(OwnerType.QUEUE);
    });

    it('ATENDIDA_HUMANO → AGENT', () => {
      expect(STATUS_OWNER_MAP[ConversationStatus.ATENDIDA_HUMANO]).toBe(OwnerType.AGENT);
    });

    it('ENCERRADA → NONE', () => {
      expect(STATUS_OWNER_MAP[ConversationStatus.ENCERRADA]).toBe(OwnerType.NONE);
    });

    it('every status has an owner type', () => {
      for (const status of Object.values(ConversationStatus)) {
        expect(STATUS_OWNER_MAP).toHaveProperty(status as string);
      }
    });
  });

  describe('complete flow', () => {
    it('full lifecycle: Nova → IA → Fila → Humano → Encerrada → Nova', () => {
      const flow: ConversationStatus[] = [
        ConversationStatus.NOVA,
        ConversationStatus.ATENDIDA_IA,
        ConversationStatus.NA_FILA,
        ConversationStatus.ATENDIDA_HUMANO,
        ConversationStatus.ENCERRADA,
        ConversationStatus.NOVA,
      ];

      for (let i = 0; i < flow.length - 1; i++) {
        expect(isValidTransition(flow[i], flow[i + 1])).toBe(true);
      }
    });

    it('return to AI flow: Humano → IA → Fila → Humano', () => {
      const flow: ConversationStatus[] = [
        ConversationStatus.ATENDIDA_HUMANO,
        ConversationStatus.ATENDIDA_IA,
        ConversationStatus.NA_FILA,
        ConversationStatus.ATENDIDA_HUMANO,
      ];

      for (let i = 0; i < flow.length - 1; i++) {
        expect(isValidTransition(flow[i], flow[i + 1])).toBe(true);
      }
    });

    it('AI resolves directly: IA → Encerrada', () => {
      expect(isValidTransition(ConversationStatus.ATENDIDA_IA, ConversationStatus.ENCERRADA)).toBe(true);
    });
  });
});
