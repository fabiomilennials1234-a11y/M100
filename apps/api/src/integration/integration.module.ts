import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ERP_QUERY_PORT } from '@motor100/shared';
import { IntegrationService } from './integration.service';
import { FlexAuthSession } from './flex/flex-auth-session';
import { FlexErpAdapter } from './flex/flex-erp.adapter';
import { ErpToolRegistry } from './erp-tool-registry';

@Module({
  imports: [ConfigModule],
  providers: [
    IntegrationService,
    FlexAuthSession,
    FlexErpAdapter,
    // Read-only ERP port — the AI consumes this; write/sync (IntegrationProvider) stays separate.
    { provide: ERP_QUERY_PORT, useExisting: FlexErpAdapter },
    ErpToolRegistry,
  ],
  exports: [IntegrationService, ERP_QUERY_PORT, ErpToolRegistry],
})
export class IntegrationModule {}
