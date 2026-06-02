import { Inject, Injectable, Logger } from '@nestjs/common';
import { ERP_QUERY_PORT, ErpQueryPort } from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface IdentityResult {
  verified: boolean;
  cdCliente?: number;
  nome?: string;
  vendedorId?: number | null;
  maskedDocument?: string;
  reason?: 'not_found' | 'phone_mismatch';
}

/** Compare the last 8 digits — tolerates country/area-code formatting differences. */
const MATCH_DIGITS = 8;

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

    const matches = customer.telefones.some((t) => this.phonesMatch(phone, t));
    if (!matches) {
      this.logger.warn(
        `Identity phone mismatch for cdCliente ${customer.cdCliente} — binding refused`,
      );
      return { verified: false, reason: 'phone_mismatch' };
    }

    await this.prisma.identityBinding.upsert({
      where: { phone },
      create: { phone, cdCliente: customer.cdCliente, verified: true },
      update: { cdCliente: customer.cdCliente, verified: true },
    });

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

  private phonesMatch(a: string, b: string): boolean {
    const da = this.digits(a);
    const db = this.digits(b);
    if (da.length < MATCH_DIGITS || db.length < MATCH_DIGITS) {
      return da === db && da.length > 0;
    }
    return da.slice(-MATCH_DIGITS) === db.slice(-MATCH_DIGITS);
  }

  private digits(s: string): string {
    return s.replace(/\D/g, '');
  }

  private mask(document: string): string {
    const d = this.digits(document);
    return `...${d.slice(-3)}`;
  }
}
