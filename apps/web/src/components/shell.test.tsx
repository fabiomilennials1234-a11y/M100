import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Shell } from './shell';

function renderShell(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Shell />
    </MemoryRouter>,
  );
}

describe('Shell', () => {
  it('renders sidebar with navigation links', () => {
    renderShell();

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fila/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /conversas/i })).toBeInTheDocument();
  });

  it('highlights active link based on current route', () => {
    renderShell('/queue');

    const queueLink = screen.getByRole('link', { name: /fila/i });
    expect(queueLink).toHaveAttribute('data-active', 'true');

    const dashLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashLink).not.toHaveAttribute('data-active', 'true');
  });

  it('toggles theme between dark and light', async () => {
    renderShell();
    const user = userEvent.setup();

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const toggle = screen.getByRole('button', { name: /tema/i });
    await user.click(toggle);

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders outlet for child routes', () => {
    renderShell('/');
    expect(screen.getByTestId('shell-content')).toBeInTheDocument();
  });
});
