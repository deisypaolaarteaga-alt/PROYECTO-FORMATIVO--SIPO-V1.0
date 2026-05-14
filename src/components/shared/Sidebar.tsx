'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { signOut } from '@/actions/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/proyectos', icon: FolderOpen, label: 'Proyectos' },
  { href: '/insumos', icon: Package, label: 'Insumos' },
{ href: '/perfil', icon: User, label: 'Perfil' },
];

/**
 * Sidebar — steel-dark background, burn-orange active accent
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger (mobile) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-concrete lg:hidden cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-charcoal" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-steel-dark',
          'flex flex-col transition-all duration-200 ease-out',
          'hidden lg:flex',
          collapsed ? 'lg:w-16' : 'lg:w-60',
          mobileOpen && '!flex w-60',
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-[60px] border-b border-white/10',
          collapsed ? 'justify-center px-2' : 'justify-between px-5',
        )}>
          {!collapsed && <Logo variant="white" size="sm" />}
          {collapsed && <Logo variant="icon" size="sm" className="[&_rect]:fill-white [&_path]:stroke-steel-dark [&_line]:stroke-steel-dark" />}

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-steel-light" />
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-steel-light" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-steel-light" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium relative',
                  'transition-all duration-150',
                  isActive
                    ? 'bg-steel-mid/50 text-white'
                    : 'text-steel-light hover:text-white hover:bg-white/5',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? item.label : undefined}
              >
                {/* Active bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent-primary)]" />
                )}
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    isActive ? 'text-white' : 'text-steel-light',
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="mx-4 border-t border-white/10" />

        {/* Footer */}
        <div className="p-3">
          <form action={signOut}>
            <button
              type="submit"
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium',
                'text-steel-light hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? 'Cerrar sesión' : undefined}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
