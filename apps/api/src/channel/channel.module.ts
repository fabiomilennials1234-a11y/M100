import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { DebounceService } from './debounce.service';
import { RateLimitGuard, REDIS_CLIENT } from './rate-limit.guard';
import Redis from 'ioredis';

@Module({
  imports: [ConfigModule],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    DebounceService,
    RateLimitGuard,
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          maxRetriesPerRequest: null,
          lazyConnect: true,
        }),
    },
  ],
  exports: [ChannelService, DebounceService],
})
export class ChannelModule {}
