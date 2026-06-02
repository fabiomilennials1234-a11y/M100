import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MessageProcessorService } from './message-processor.service';

@Processor('message-processing')
export class MessageWorker extends WorkerHost {
  private readonly logger = new Logger(MessageWorker.name);

  constructor(
    private readonly processorService: MessageProcessorService,
    @InjectQueue('message-processing-failed') private readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<{ phone: string; content: string; instanceId: string }>) {
    this.logger.log(`Processing job ${job.id} for ${job.data.phone}`);
    await this.processorService.processJob(job);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error(
        `Job ${job.id} failed permanently after ${job.attemptsMade} attempts. Moving to DLQ.`,
      );
      await this.dlq.add('failed-message', {
        ...job.data,
        originalJobId: job.id,
        failedReason: error.message,
        attemptsMade: job.attemptsMade,
      });
    }
  }
}
