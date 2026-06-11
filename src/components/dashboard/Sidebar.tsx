'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Shield,
  Layers,
  LogOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  id: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    id: 'nav-dashboard',
  },
  {
    label: 'Inventory Shield',
    href: '/dashboard/inventory',
    icon: <Shield size={20} />,
    id: 'nav-inventory',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

function SidebarContent({
  userEmail,
  onClose,
}: {
  userEmail: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <Sparkles size={24} className="text-primary" />
          <span className="text-xl font-bold font-heading gradient-text">
            EcomAutoPilot
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all duration-200',
                isActive
                  ? 'border-l-4 border-primary bg-primary/10 text-primary font-medium'
                  : 'text-text-muted hover:text-text hover:bg-surface-alt'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 space-y-4 border-t border-border pt-4 mt-4">
        <ThemeToggle />

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted truncate max-w-[180px]">
            {userEmail}
          </span>
          <button
            className="text-text-muted hover:text-danger transition-colors duration-200"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  userEmail = 'user@ecom.com',
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-surface/80 dark:glass border-r border-border flex-col z-40">
        <SidebarContent userEmail={userEmail} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.aside
              className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-surface/80 dark:glass border-r border-border z-50 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <SidebarContent userEmail={userEmail} onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
