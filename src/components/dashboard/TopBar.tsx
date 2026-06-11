'use client';

import { Menu, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16 border-b border-border',
        'bg-bg/80 dark:bg-bg/80 backdrop-blur-xl'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            id="menu-toggle"
            className="lg:hidden text-text-muted hover:text-text transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold font-heading">{title}</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Notification Bell */}
          <button
            id="notifications-bell"
            className="relative p-2 text-text-muted hover:text-text transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* User Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            }}
          >
            U
          </div>
        </div>
      </div>
    </header>
  );
}
