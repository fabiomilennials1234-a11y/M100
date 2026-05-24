import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, MessageSquare, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/queue', label: 'Fila', icon: Inbox },
  { to: '/conversations', label: 'Conversas', icon: MessageSquare },
] as const;

function SidebarLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  const { pathname } = useLocation();
  const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      data-active={isActive ? 'true' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-sidebar-active'
          : 'text-sidebar-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Shell() {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="text-lg font-bold text-foreground">Motor100</span>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <SidebarLink key={to} to={to} label={label} icon={Icon} />
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={toggle}
            aria-label="Alternar tema"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto" data-testid="shell-content">
        <Outlet />
      </main>
    </div>
  );
}
