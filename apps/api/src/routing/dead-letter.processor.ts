import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('message-processing-failed')
export class DeadLetterProcessor extends WorkerHost {
  private readonly logger = new Logger(DeadLetterProcessor.name);

  async process(job: Job<{ phone: string; content: string }>) {
    this.logger.error(
      `Dead letter: job ${job.id} failed after ${job.attemptsMade} attempts. ` +
      `Phone: ${job.data.phone}. Error: ${job.failedReason}`,
    );
  }
}
