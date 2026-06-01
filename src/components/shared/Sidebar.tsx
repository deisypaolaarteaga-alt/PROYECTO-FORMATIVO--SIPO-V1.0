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
  BookOpen,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { signOut } from '@/actions/auth';
import { Avatar } from '@/components/shared/Avatar';
import { createClient } from '@/lib/supabase/client';

// ── Tokens de color del sidebar ───────────────────────────────────────────────
const SIDEBAR_BG      = '#1A2535';
const SIDEBAR_SURFACE = '#131d2b';

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
  rol: 'usuario' | 'super_admin';
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
      { href: '/mano-obra',    icon: HardHat,      label: 'Tarifas Salariales' },
      { href: '/catalogo',     icon: BookOpen,     label: 'Catálogo'     },
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

  if (collapsed) {
    return (
      <li className="flex justify-center px-2 my-0.5">
        <Link
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
          title={item.label}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150',
            isActive
              ? 'bg-[#C84B1A]/20 text-[#E8956A]'
              : 'text-white/35 hover:bg-white/8 hover:text-white/70',
          )}
        >
          <item.icon className="w-[18px] h-[18px] shrink-0" />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 text-[13px] font-medium',
          'py-[7px] pr-4 pl-[9px]',
          'border-l-[3px] transition-all duration-150',
          isActive
            ? 'border-[#C84B1A] bg-white/[0.07] text-white'
            : 'border-transparent text-white/45 hover:bg-white/[0.05] hover:text-white/80 hover:border-[#C84B1A]/30',
        )}
      >
        <item.icon className="w-[18px] h-[18px] shrink-0" />
        <span>{item.label}</span>
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
    <div className="mb-1">
      {group.heading && !collapsed && (
        <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold tracking-[0.18em] text-white/20 select-none uppercase">
          {group.heading}
        </p>
      )}
      {group.heading && collapsed && (
        <div className="mx-3 my-2 h-px bg-white/8" aria-hidden="true" />
      )}
      <ul className="space-y-px">
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
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-38 rounded-xl border border-white/10 shadow-xl overflow-hidden"
              style={{ background: SIDEBAR_SURFACE }}
            >
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-white/55 hover:bg-white/8 hover:text-white transition-colors duration-150 cursor-pointer"
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
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 border-t border-white/8 overflow-hidden"
          style={{ background: SIDEBAR_SURFACE }}
        >
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-5 py-3 text-[13px] font-medium text-white/50 hover:bg-white/8 hover:text-white transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer"
      >
        <Avatar name={user.nombre} size="sm" className="shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-medium text-white/85 truncate leading-tight">
            {user.nombre}
          </p>
          <p className="text-[11px] text-white/35 truncate leading-tight mt-0.5">
            {user.rol === 'super_admin' ? 'Administrador' : (user.empresa || 'Usuario')}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-white/25 shrink-0 transition-transform duration-150',
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
      {/* ── Header: Logo ────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center shrink-0 h-[68px]',
          collapsed ? 'justify-center px-2' : 'justify-between px-5',
        )}
      >
        {!collapsed ? (
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <Logo variant="icon" size="sm" />
              <span
                className="text-[19px] font-semibold text-white leading-none tracking-[0.03em]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                SIPO
              </span>
            </div>
            <span className="text-[9px] font-medium tracking-[0.14em] text-white/22 uppercase leading-tight pl-[26px]">
              Presupuestos de obra
            </span>
          </div>
        ) : (
          <Logo variant="icon" size="sm" />
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/8 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4 text-white/35" />
          </button>
        )}

        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-white/8 transition-colors cursor-pointer shrink-0"
            aria-label="Contraer menú"
          >
            <ChevronLeft className="h-4 w-4 text-white/30" />
          </button>
        )}
      </div>

      {/* ── Navegación ───────────────────────────────────────────────────── */}
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
  const [user, setUser] = useState<UserProfile>({ nombre: 'Usuario', empresa: '', rol: 'usuario' });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) return;
      supabase
        .from('profiles')
        .select('nombre_completo, empresa, rol')
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
            rol: (profile?.rol as 'usuario' | 'super_admin') ?? 'usuario',
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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer mobile ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 lg:hidden',
          'border-r border-white/[0.06]',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: SIDEBAR_BG }}
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
          'border-r border-white/[0.06]',
          'transition-all duration-200 ease-out',
          collapsed ? 'w-16' : 'w-64',
        )}
        style={{ background: SIDEBAR_BG }}
        aria-label="Menú de navegación"
      >
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full border border-white/12 hover:bg-white/10 transition-colors cursor-pointer"
            style={{ background: SIDEBAR_BG }}
            aria-label="Expandir menú"
          >
            <ChevronRight className="h-3 w-3 text-white/40" />
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
