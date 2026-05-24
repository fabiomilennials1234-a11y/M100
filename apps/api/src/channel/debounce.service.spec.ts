import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DebounceService } from './debounce.service';
import { DomainEvent } from '@motor100/shared';

describe('DebounceService', () => {
  let service: DebounceService;
  let events: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebounceService,
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(DebounceService);
    events = module.get(EventEmitter2);
  });

  afterEach(() => {
    service.clearAll();
  });

  it('flushes single message after timeout', async () => {
    jest.useFakeTimers();

    service.debounce('+5511999990000', 'oi');

    jest.advanceTimersByTime(3000);

    expect(events.emit).toHaveBeenCalledWith(DomainEvent.DEBOUNCE_FLUSHED, {
      phone: '+5511999990000',
      content: 'oi',
    });

    jest.useRealTimers();
  });

  it('concatenates rapid messages from same phone', () => {
    jest.useFakeTimers();

    service.debounce('+5511999990000', 'oi');
    jest.advanceTimersByTime(500);
    service.debounce('+5511999990000', 'tudo bem?');
    jest.advanceTimersByTime(500);
    service.debounce('+5511999990000', 'preciso de ajuda');

    jest.advanceTimersByTime(3000);

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(DomainEvent.DEBOUNCE_FLUSHED, {
      phone: '+5511999990000',
      content: 'oi\ntudo bem?\npreciso de ajuda',
    });

    jest.useRealTimers();
  });

  it('keeps independent buffers per phone', () => {
    jest.useFakeTimers();

    service.debounce('+5511111111111', 'msg phone 1');
    service.debounce('+5522222222222', 'msg phone 2');

    jest.advanceTimersByTime(3000);

    expect(events.emit).toHaveBeenCalledTimes(2);
    expect(events.emit).toHaveBeenCalledWith(DomainEvent.DEBOUNCE_FLUSHED, {
      phone: '+5511111111111',
      content: 'msg phone 1',
    });
    expect(events.emit).toHaveBeenCalledWith(DomainEvent.DEBOUNCE_FLUSHED, {
      phone: '+5522222222222',
      content: 'msg phone 2',
    });

    jest.useRealTimers();
  });

  it('resets timer on each new message', () => {
    jest.useFakeTimers();

    service.debounce('+5511999990000', 'oi');
    jest.advanceTimersByTime(2500);

    service.debounce('+5511999990000', 'mais uma');
    jest.advanceTimersByTime(2500);

    expect(events.emit).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(DomainEvent.DEBOUNCE_FLUSHED, {
      phone: '+5511999990000',
      content: 'oi\nmais uma',
    });

    jest.useRealTimers();
  });

  it('clearAll cancels all pending timers', () => {
    jest.useFakeTimers();

    service.debounce('+5511111111111', 'msg 1');
    service.debounce('+5522222222222', 'msg 2');

    service.clearAll();

    jest.advanceTimersByTime(5000);

    expect(events.emit).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
