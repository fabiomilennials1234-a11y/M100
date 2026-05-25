import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Inbox, MessageSquare, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/queue', label: 'Fila', icon: Inbox },
  { to: '/conversations', label: 'Conversas', icon: MessageSquare },
] as const;

function NavContent() {
  const { theme, toggleTheme } = useTheme();
  const { agent, signOut } = useAuth();

  return (
    <>
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
      <div className="p-3 space-y-3">
        <Separator />
        {/* Theme toggle */}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </Button>

        {/* User info */}
        {agent && (
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar size="sm">
                <AvatarFallback>{agent.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {agent.name}
                </p>
                <span className="text-xs text-muted-foreground">{agent.role}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Sign out"
                  />
                }
              >
                <LogOut size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>
                  <LogOut size={14} />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </>
  );
}

export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
          {/* Logo */}
          <div className="flex h-14 items-center px-5">
            <span className="text-lg font-bold text-foreground">Motor100</span>
          </div>
          <NavContent />
        </aside>

        {/* Mobile sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-60 p-0">
            <SheetHeader className="px-5 py-3">
              <SheetTitle>Motor100</SheetTitle>
            </SheetHeader>
            <NavContent />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <header className="flex items-center border-b border-border bg-card px-4 py-2 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Open menu" />
                }
              >
                <Menu size={18} />
              </SheetTrigger>
            </Sheet>
            <span className="ml-3 text-sm font-bold text-foreground">Motor100</span>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
