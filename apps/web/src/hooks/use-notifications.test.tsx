import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockToastInfo } = vi.hoisted(() => ({
  mockToastInfo: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: mockToastInfo,
  },
}));

import { useNotifications } from './use-notifications';

describe('useNotifications', () => {
  let originalNotification: typeof Notification;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNotification = globalThis.Notification;

    Object.defineProperty(globalThis, 'Notification', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis.Notification, 'requestPermission', {
      value: vi.fn().mockResolvedValue('granted'),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    });
  });

  it('notifyNewInQueue shows toast and browser notification', async () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyNewInQueue('+5511999990001');
    });

    expect(mockToastInfo).toHaveBeenCalledWith(
      expect.stringContaining('+5511999990001'),
      expect.any(Object),
    );
    expect(globalThis.Notification).toHaveBeenCalledWith(
      expect.stringContaining('fila'),
      expect.objectContaining({ body: expect.stringContaining('+5511999990001') }),
    );
  });

  it('notifyNewMessage shows toast', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyNewMessage('conv-1', 'Olá!');
    });

    expect(mockToastInfo).toHaveBeenCalledWith(
      expect.stringContaining('Olá!'),
      expect.any(Object),
    );
  });

  it('requestPermission calls Notification.requestPermission', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(globalThis.Notification.requestPermission).toHaveBeenCalled();
  });

  it('skips browser notification when permission denied', () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'denied',
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyNewInQueue('+5511999990001');
    });

    expect(mockToastInfo).toHaveBeenCalled();
    expect(globalThis.Notification).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
    );
  });
});
