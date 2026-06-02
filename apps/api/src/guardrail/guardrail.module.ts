import { Module } from '@nestjs/common';
import { GUARDRAIL_PORT } from '@motor100/shared';
import { GuardrailService } from './guardrail.service';

@Module({
  providers: [
    GuardrailService,
    { provide: GUARDRAIL_PORT, useExisting: GuardrailService },
  ],
  exports: [GuardrailService, GUARDRAIL_PORT],
})
export class GuardrailModule {}
