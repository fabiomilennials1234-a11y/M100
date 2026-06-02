import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { INSTANCE_PORT } from '@motor100/shared';
import { PrismaModule } from '../prisma';
import { InstanceService } from './instance.service';
import { UazapiInstanceClient } from './uazapi-instance.client';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    InstanceService,
    UazapiInstanceClient,
    { provide: INSTANCE_PORT, useExisting: InstanceService },
  ],
  exports: [InstanceService, INSTANCE_PORT],
})
export class InstanceModule {}
