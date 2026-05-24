import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MemoryModule } from '../memory/memory.module';

@Module({
  imports: [PrismaModule, MemoryModule],
  providers: [SummaryService],
  exports: [SummaryService],
})
export class SummaryModule {}
