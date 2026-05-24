import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockToastInfo } = vi.hoisted(() => ({
  mockToastInfo: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { info: mockToastInfo },
}));

import { notifyNewInQueue, notifyNewMessage, requestPermission } from './use-notifications';

describe('notifications', () => {
  let notificationSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationSpy = vi.fn();
    // @ts-expect-error - mocking Notification
    globalThis.Notification = notificationSpy;
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    });
  });

  it('sends toast and browser notification for new queue item', () => {
    notifyNewInQueue('+5511999990001');
    expect(mockToastInfo).toHaveBeenCalledWith(
      'Nova conversa na fila: +5511999990001',
    );
    expect(notificationSpy).toHaveBeenCalledWith('Motor100', {
      body: 'Nova conversa na fila: +5511999990001',
    });
  });

  it('sends toast for new message', () => {
    notifyNewMessage('c1', 'Olá!');
    expect(mockToastInfo).toHaveBeenCalledWith('Nova mensagem: Olá!');
    expect(notificationSpy).toHaveBeenCalledWith('Motor100', {
      body: 'Nova mensagem em c1: Olá!',
    });
  });

  it('calls requestPermission when permission is default', () => {
    const reqPerm = vi.fn();
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    });
    globalThis.Notification.requestPermission = reqPerm;
    requestPermission();
    expect(reqPerm).toHaveBeenCalled();
  });

  it('skips browser notification when permission denied', () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'denied',
      writable: true,
      configurable: true,
    });
    notificationSpy.mockClear();
    notifyNewInQueue('+5511999990001');
    // Toast still fires
    expect(mockToastInfo).toHaveBeenCalled();
    // Browser notification does NOT fire
    expect(notificationSpy).not.toHaveBeenCalled();
  });
});
