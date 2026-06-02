import { Inject, Injectable, Logger } from '@nestjs/common';
import { ERP_QUERY_PORT, ErpQueryPort } from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface IdentityResult {
  verified: boolean;
  cdCliente?: number;
  nome?: string;
  vendedorId?: number | null;
  maskedDocument?: string;
  reason?: 'not_found' | 'phone_mismatch' | 'no_phones_on_record' | 'binding_conflict';
}

/**
 * Compare the last 10 digits (DDD + subscriber) after stripping the BR country
 * code — strong enough to reject cross-DDD collisions, while tolerating the
 * country-code prefix and formatting. Final tuning belongs to #51 (real data).
 */
const MATCH_DIGITS = 10;

/**
 * Resolves and persists the verified link between a WhatsApp phone and a Cliente
 * Flex. A binding is created ONLY when the customer's document resolves AND the
 * WhatsApp phone matches a phone on the Flex cadastro — anti-impersonation.
 */
@Injectable()
export class IdentityResolver {
  private readonly logger = new Logger(IdentityResolver.name);

  constructor(
    @Inject(ERP_QUERY_PORT) private readonly erp: ErpQueryPort,
    private readonly prisma: PrismaService,
  ) {}

  async resolve(phone: string, document: string): Promise<IdentityResult> {
    const customer = await this.erp.getCustomerByDocument(document);
    if (!customer) {
      return { verified: false, reason: 'not_found' };
    }

    if (customer.telefones.length === 0) {
      // Never log the internal cdCliente.
      this.logger.warn('Cliente without phones on cadastro — cannot verify');
      return { verified: false, reason: 'no_phones_on_record' };
    }

    const matches = customer.telefones.some((t) => this.phonesMatch(phone, t));
    if (!matches) {
      this.logger.warn('Identity phone mismatch — binding refused');
      return { verified: false, reason: 'phone_mismatch' };
    }

    // Binding is write-once per phone: a phone already linked to a DIFFERENT
    // cliente is never rebound (anti-hijack). Concurrency is closed by the DB
    // unique constraint on phone + create-then-catch (no silent overwrite).
    const existing = await this.prisma.identityBinding.findUnique({
      where: { phone },
    });
    if (existing) {
      if (existing.cdCliente !== customer.cdCliente) {
        this.logger.error('Binding conflict — phone already linked elsewhere; refused');
        return { verified: false, reason: 'binding_conflict' };
      }
      // Same cliente — already bound, idempotent.
    } else {
      try {
        await this.prisma.identityBinding.create({
          data: { phone, cdCliente: customer.cdCliente, verified: true },
        });
      } catch (e: any) {
        // Only swallow the unique-constraint violation (concurrent create race).
        // Transient/real errors must NOT be reported as a verified binding.
        if (e?.code !== 'P2002') {
          throw e;
        }
        // Lost a concurrent create race — re-read and treat a different
        // cliente as a conflict rather than overwriting.
        const now = await this.prisma.identityBinding.findUnique({ where: { phone } });
        if (now && now.cdCliente !== customer.cdCliente) {
          this.logger.error('Binding conflict (concurrent) — refused');
          return { verified: false, reason: 'binding_conflict' };
        }
      }
    }

    return {
      verified: true,
      cdCliente: customer.cdCliente,
      nome: customer.nome,
      vendedorId: customer.vendedorId,
      maskedDocument: this.mask(document),
    };
  }

  async getBinding(phone: string): Promise<{ cdCliente: number } | null> {
    const binding = await this.prisma.identityBinding.findUnique({
      where: { phone },
    });
    return binding ? { cdCliente: binding.cdCliente } : null;
  }

  /**
   * Compares phones by a normalized key (DDD + last 8 subscriber digits).
   * Stripping the country code + the optional mobile 9th digit avoids both
   * cross-DDD collisions and 9-digit formatting variance.
   */
  private phonesMatch(a: string, b: string): boolean {
    const ka = this.key(a);
    const kb = this.key(b);
    return ka !== '' && ka === kb;
  }

  /** Normalized comparison key: DDD (2) + last 8 digits, after stripping DDI 55. */
  private key(s: string): string {
    const d = this.normalize(s);
    if (d.length < MATCH_DIGITS) return '';
    return d.slice(0, 2) + d.slice(-8);
  }

  /** Digits only, with the Brazilian country code (55) stripped when present. */
  private normalize(s: string): string {
    const d = this.digits(s);
    if (d.length > 11 && d.startsWith('55')) {
      return d.slice(2);
    }
    return d;
  }

  private digits(s: string): string {
    return s.replace(/\D/g, '');
  }

  private mask(document: string): string {
    const d = this.digits(document);
    return `...${d.slice(-3)}`;
  }
}
