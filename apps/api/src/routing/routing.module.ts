import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RoutingService } from './routing.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'routing' }),
  ],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
