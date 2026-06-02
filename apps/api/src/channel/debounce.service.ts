import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@motor100/shared';

interface DebounceBuffer {
  messages: string[];
  instanceId: string;
  timer: NodeJS.Timeout;
}

@Injectable()
export class DebounceService {
  private readonly buffers = new Map<string, DebounceBuffer>();
  private readonly timeoutMs: number;

  constructor(private readonly events: EventEmitter2) {
    this.timeoutMs = parseInt(process.env.DEBOUNCE_TIMEOUT_MS ?? '3000', 10);
  }

  debounce(phone: string, content: string, instanceId: string): void {
    const existing = this.buffers.get(phone);

    if (existing) {
      clearTimeout(existing.timer);
      existing.messages.push(content);
      existing.instanceId = instanceId;
      existing.timer = this.createTimer(phone);
    } else {
      this.buffers.set(phone, {
        messages: [content],
        instanceId,
        timer: this.createTimer(phone),
      });
    }
  }

  clearAll(): void {
    for (const buffer of this.buffers.values()) {
      clearTimeout(buffer.timer);
    }
    this.buffers.clear();
  }

  private createTimer(phone: string): NodeJS.Timeout {
    return setTimeout(() => this.flush(phone), this.timeoutMs);
  }

  private flush(phone: string): void {
    const buffer = this.buffers.get(phone);
    if (!buffer) return;

    const content = buffer.messages.join('\n');
    const { instanceId } = buffer;
    this.buffers.delete(phone);

    this.events.emit(DomainEvent.DEBOUNCE_FLUSHED, {
      phone,
      content,
      instanceId,
    });
  }
}
