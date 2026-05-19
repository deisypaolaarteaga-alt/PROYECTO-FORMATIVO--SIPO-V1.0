'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  ShoppingBag,
  Package,
  HardHat,
  Building2,
  Receipt,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { signOut } from '@/actions/auth';
import { Avatar } from '@/components/shared/Avatar';
import { createClient } from '@/lib/supabase/client';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  heading: string | null;
  items: NavItem[];
}

interface UserProfile {
  nombre: string;
  empresa: string;
}

// ── Estructura de navegación ──────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    heading: 'GESTIÓN',
    items: [
      { href: '/proyectos',    icon: FolderKanban, label: 'Proyectos'    },
      { href: '/presupuestos', icon: FileText,     label: 'Presupuestos' },
      { href: '/clientes',     icon: Users,        label: 'Clientes'     },
      { href: '/proveedores',  icon: ShoppingBag,  label: 'Proveedores'  },
      { href: '/insumos',      icon: Package,      label: 'Insumos'      },
      { href: '/mano-obra',    icon: HardHat,      label: 'Mano de obra' },
    ],
  },
  {
    heading: 'CONFIGURACIÓN',
    items: [
      { href: '/perfil',              icon: Building2, label: 'Perfil de empresa'   },
      { href: '/parametros-fiscales', icon: Receipt,   label: 'Parámetros fiscales' },
    ],
  },
];

// ── NavLink ───────────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <li className={cn(!collapsed && 'px-2')}>
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          'flex items-center text-[13px] font-medium transition-colors duration-150 rounded-lg',
          collapsed ? 'justify-center py-3 w-full' : 'gap-3 px-3 py-2',
          isActive
            ? 'bg-[#D95510] text-white shadow-sm'
            : 'text-white/60 hover:bg-white/8 hover:text-white/90',
        )}
      >
        <item.icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    </li>
  );
}

// ── NavGroupSection ───────────────────────────────────────────────────────────

function NavGroupSection({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="mb-2">
      {group.heading && !collapsed && (
        <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold tracking-[0.16em] text-white/25 select-none uppercase">
          {group.heading}
        </p>
      )}
      {group.heading && collapsed && (
        <div className="mx-3 my-2 h-px bg-white/10" aria-hidden="true" />
      )}
      <ul>
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </ul>
    </div>
  );
}

// ── UserProfileFooter ─────────────────────────────────────────────────────────

function UserProfileFooter({
  user,
  collapsed,
}: {
  user: UserProfile;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-white/8 py-3 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative"
          aria-label="Menú de usuario"
        >
          <Avatar name={user.nombre} size="sm" />
          {open && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 rounded-xl border border-white/10 bg-[#131d2b] shadow-xl overflow-hidden">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-white/60 hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-white/8 relative">
      {/* Dropdown — aparece encima del trigger */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 border-t border-white/8 bg-[#131d2b] overflow-hidden">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-5 py-3 text-[13px] font-medium text-white/55 hover:bg-white/8 hover:text-white transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      )}

      {/* Fila del perfil */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-white/5 transition-colors duration-150 cursor-pointer"
      >
        <Avatar name={user.nombre} size="md" className="shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-semibold text-white/90 truncate leading-tight">
            {user.nombre}
          </p>
          <p className="text-[11px] text-white/45 truncate leading-tight mt-0.5">
            {user.empresa || 'Administrador'}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/35 shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>
    </div>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  user,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  pathname: string;
  user: UserProfile;
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* ── Header: Logo + subtítulo ────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center shrink-0 h-[68px]',
          collapsed ? 'justify-center px-2' : 'justify-between px-5',
        )}
      >
        {!collapsed ? (
          <div className="flex flex-col gap-0.5 min-w-0">
            <Logo variant="white" size="sm" />
            <span className="text-[8px] font-medium tracking-[0.14em] text-white/30 uppercase leading-tight">
              Sistema inteligente de presupuestos de obra
            </span>
          </div>
        ) : (
          <Logo variant="icon" size="sm" />
        )}

        {/* Botón cerrar drawer (mobile) */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4 text-white/40" />
          </button>
        )}

        {/* Botón colapsar/expandir (desktop, solo cuando expandido) */}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Contraer menú"
          >
            <ChevronLeft className="h-4 w-4 text-white/40" />
          </button>
        )}
      </div>

      {/* ── Navegación agrupada ───────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-1"
        aria-label="Navegación principal"
      >
        {NAV_GROUPS.map((group, i) => (
          <NavGroupSection
            key={i}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ── Perfil de usuario ─────────────────────────────────────────────── */}
      <UserProfileFooter user={user} collapsed={collapsed} />
    </div>
  );
}

// ── Sidebar (componente raíz) ─────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>({ nombre: 'Usuario', empresa: '' });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) return;
      supabase
        .from('profiles')
        .select('nombre_completo, empresa')
        .eq('id', authUser.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setUser({
            nombre:
              profile?.nombre_completo ||
              authUser.user_metadata?.nombre_completo ||
              authUser.email ||
              'Usuario',
            empresa: profile?.empresa || authUser.user_metadata?.empresa || '',
          });
        });
    });
  }, []);

  return (
    <>
      {/* ── Botón hamburguesa (solo mobile) ─────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-[#D0D4DB] shadow-sm lg:hidden cursor-pointer"
        aria-label="Abrir menú de navegación"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-5 w-5 text-[#4B5563]" />
      </button>

      {/* ── Overlay mobile ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer mobile ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 lg:hidden',
          'border-r border-white/8',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: '#1A2535' }}
        aria-label="Menú de navegación"
        aria-hidden={!mobileOpen}
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          collapsed={false}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 left-0 h-screen',
          'border-r border-white/8',
          'transition-all duration-200 ease-out',
          collapsed ? 'w-16' : 'w-64',
        )}
        style={{ background: '#1A2535' }}
        aria-label="Menú de navegación"
      >
        {/* Botón expandir — visible solo cuando colapsado, anclado al borde */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1A2535] border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Expandir menú"
          >
            <ChevronRight className="h-3 w-3 text-white/50" />
          </button>
        )}

        <SidebarContent
          pathname={pathname}
          user={user}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>
    </>
  );
}
