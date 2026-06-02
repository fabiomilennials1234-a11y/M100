import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { MemoryModule } from '../memory/memory.module';
import { GuardrailModule } from '../guardrail/guardrail.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  // GuardrailModule + IntegrationModule make GUARDRAIL_PORT and ErpToolRegistry
  // available where AiService is instantiated, so the ERP tool-calling loop is
  // wired on the same instance routing exposes as AI_PORT.
  imports: [MemoryModule, GuardrailModule, IntegrationModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
