import { Injectable } from '@nestjs/common';

export interface InputSanitization {
  sanitized: string;
  piiRedacted: boolean;
  injectionFlagged: boolean;
  flags: string[];
}

export interface OutputValidation {
  valid: boolean;
  action: 'pass' | 'handoff';
  reason?: string;
}

@Injectable()
export class GuardrailService {
  private readonly PII_PATTERNS: Array<{ regex: RegExp; token: string; flag: string }> = [
    { regex: /\d{3}\.\d{3}\.\d{3}-\d{2}/g, token: '[CPF_REDACTED]', flag: 'cpf_redacted' },
    { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, token: '[EMAIL_REDACTED]', flag: 'email_redacted' },
    { regex: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, token: '[CARD_REDACTED]', flag: 'card_redacted' },
    { regex: /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, token: '[PHONE_REDACTED]', flag: 'phone_redacted' },
  ];

  private readonly INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /ignore\s+(all\s+)?above\s+instructions/i,
    /system\s+prompt/i,
    /you\s+are\s+now/i,
    /act\s+as\s+(a\s+)?different/i,
    /disregard\s+(all\s+)?prior/i,
    /override\s+(your\s+)?instructions/i,
    /forget\s+(all\s+)?(your\s+)?instructions/i,
    /reveal\s+(your\s+)?(system|initial)\s+prompt/i,
    /pretend\s+you\s+are/i,
  ];

  sanitizeInput(text: string): InputSanitization {
    const flags: string[] = [];
    let sanitized = text;

    for (const { regex, token, flag } of this.PII_PATTERNS) {
      const pattern = new RegExp(regex.source, regex.flags);
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(new RegExp(regex.source, regex.flags), token);
        flags.push(flag);
      }
    }

    let injectionFlagged = false;
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        injectionFlagged = true;
        flags.push('injection_flagged');
        break;
      }
    }

    return {
      sanitized,
      piiRedacted: flags.some(f => f.endsWith('_redacted')),
      injectionFlagged,
      flags,
    };
  }

  private readonly MAX_OUTPUT_LENGTH = 4096;

  private readonly OUTPUT_BLOCKLIST = [
    /cartão\s+de\s+crédito\s+(do|da)\s+cliente/i,
    /senha\s+(do|da)\s+cliente/i,
    /dados\s+bancários/i,
    /número\s+do\s+cartão/i,
  ];

  validateOutput(text: string): OutputValidation {
    if (text.length > this.MAX_OUTPUT_LENGTH) {
      return { valid: false, action: 'handoff', reason: 'output_length_exceeded' };
    }

    for (const { regex } of this.PII_PATTERNS) {
      if (new RegExp(regex.source, regex.flags).test(text)) {
        return { valid: false, action: 'handoff', reason: 'pii_leakage_detected' };
      }
    }

    for (const pattern of this.OUTPUT_BLOCKLIST) {
      if (pattern.test(text)) {
        return { valid: false, action: 'handoff', reason: 'blocklist_term_detected' };
      }
    }

    return { valid: true, action: 'pass' };
  }
}
