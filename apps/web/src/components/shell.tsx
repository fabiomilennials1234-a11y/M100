import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Inbox, MessageSquare, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/queue', label: 'Fila', icon: Inbox },
  { to: '/conversations', label: 'Conversas', icon: MessageSquare },
] as const;

export function Shell() {
  const { theme, toggleTheme } = useTheme();
  const { agent, signOut } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center px-5">
          <span className="text-lg font-bold text-foreground">Motor100</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )
              }
              data-active={undefined}
            >
              {({ isActive }) => (
                <span
                  className="flex items-center gap-3"
                  data-active={isActive ? 'true' : undefined}
                >
                  <Icon size={18} />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>

          {/* User info */}
          {agent && (
            <div className="flex items-center justify-between px-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {agent.name}
                </p>
                <span className="text-xs text-muted-foreground">{agent.role}</span>
              </div>
              <button
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
