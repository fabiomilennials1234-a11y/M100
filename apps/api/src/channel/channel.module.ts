import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { DebounceService } from './debounce.service';

@Module({
  imports: [ConfigModule],
  controllers: [ChannelController],
  providers: [ChannelService, DebounceService],
  exports: [ChannelService, DebounceService],
})
export class ChannelModule {}
