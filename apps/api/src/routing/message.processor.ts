import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MessageProcessorService } from './message-processor.service';

@Processor('message-processing')
export class MessageWorker extends WorkerHost {
  private readonly logger = new Logger(MessageWorker.name);

  constructor(private readonly processorService: MessageProcessorService) {
    super();
  }

  async process(job: Job<{ phone: string; content: string }>) {
    this.logger.log(`Processing job ${job.id} for ${job.data.phone}`);
    await this.processorService.processJob(job);
  }
}
