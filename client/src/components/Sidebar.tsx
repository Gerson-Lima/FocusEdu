import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  ListTodo,
  KanbanSquare,
  History,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from '../assets/logo.svg';
import LogoRet from '../assets/logo-ret.png';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/activities', label: 'Minhas Atividades', icon: ListTodo },
  { path: '/kanban', label: 'Quadro Kanban', icon: KanbanSquare },
  { path: '/history', label: 'Histórico', icon: History },
];

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('focusedu_sidebar_collapsed');
    return stored === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      'focusedu_sidebar_collapsed',
      collapsed ? 'true' : 'false'
    );
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'bg-slate-900 text-white flex flex-col transition-all duration-100 rounded-e-3xl h-svh',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-center gap-3">
          <img
            src={collapsed ? LogoRet : Logo}
            className={
              collapsed
                ? 'h-full w-full flex-shrink-0'
                : 'h-3/4 w-3/4 flex-shrink-0'
            }
          />
        </div>
      </div>

      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'relative flex items-center gap-3 px-6 py-5 rounded-lg transition-colors',
                    'hover:bg-slate-800/60',
                    collapsed && 'justify-center px-0',
                    isActive ? 'text-white' : 'text-slate-400'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full bg-[#59D7F0]" />
                  )}

                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-slate-400'
                    )}
                  />
                  {!collapsed && (
                    <span
                      className={cn(
                        'font-medium',
                        isActive && 'text-white'
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full',
            'hover:bg-slate-800',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 flex-shrink-0 transition-transform text-slate-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>
    </aside>
  );
}
